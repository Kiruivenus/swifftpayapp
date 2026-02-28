import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ConversionControl from '@/models/ConversionControl';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const body = await req.json();
        const { frozen, reason = '' } = body;

        await dbConnect();
        const control = await (ConversionControl as any).getSettings();
        const before = { frozen: control.conversionsFrozen, reason: control.freezeReason };

        control.conversionsFrozen = frozen;
        control.freezeReason = reason;
        control.frozenBy = admin.id;
        control.frozenAt = new Date();
        await control.save();

        const after = { frozen, reason };

        // Audit Log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: frozen ? 'FREEZE_CONVERSIONS' : 'UNFREEZE_CONVERSIONS',
            targetType: 'SYSTEM',
            targetId: 'GLOBAL',
            details: { frozen, reason, before, after },
            ipAddress: ip,
            userAgent: ua,
            severity: frozen ? 'CRITICAL' : 'INFO'
        });

        // Write Rate History
        await RateHistory.create({
            type: 'freeze',
            before,
            after,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        return NextResponse.json({ success: true, data: control });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
