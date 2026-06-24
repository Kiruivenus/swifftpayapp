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
        const {
            conversionsFrozen,
            depositsFrozen,
            withdrawalsFrozen,
            disabledRegions,
            disabledCurrencies,
            frozen, // Legacy support
            reason = ''
        } = body;

        await dbConnect();
        const control = await (ConversionControl as any).getSettings();
        const before = JSON.parse(JSON.stringify(control));

        // Set parameters if provided
        if (conversionsFrozen !== undefined) control.conversionsFrozen = conversionsFrozen;
        else if (frozen !== undefined) control.conversionsFrozen = frozen; // Fallback
        
        if (depositsFrozen !== undefined) control.depositsFrozen = depositsFrozen;
        if (withdrawalsFrozen !== undefined) control.withdrawalsFrozen = withdrawalsFrozen;
        if (disabledRegions !== undefined) control.disabledRegions = disabledRegions;
        if (disabledCurrencies !== undefined) control.disabledCurrencies = disabledCurrencies;
        
        control.freezeReason = reason;
        control.frozenBy = admin.id;
        control.frozenAt = new Date();
        await control.save();

        const after = JSON.parse(JSON.stringify(control));

        // Audit Log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'EMERGENCY_FREEZE_UPDATE',
            targetType: 'SYSTEM',
            targetId: 'GLOBAL',
            details: { before, after, reason },
            ipAddress: ip,
            userAgent: ua,
            severity: 'CRITICAL'
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
