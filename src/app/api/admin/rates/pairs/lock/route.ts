import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FxRate from '@/models/FxRate';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const body = await req.json();
        const { baseCurrency, quoteCurrency, isLocked } = body;

        if (!baseCurrency || !quoteCurrency || isLocked === undefined) {
            return NextResponse.json({ success: false, message: 'Missing baseCurrency, quoteCurrency, or isLocked specifications.' }, { status: 400 });
        }

        await dbConnect();

        const before = await FxRate.findOne({
            baseCurrency: baseCurrency.toUpperCase(),
            quoteCurrency: quoteCurrency.toUpperCase()
        });

        if (!before) {
            return NextResponse.json({ success: false, message: 'Currency rate pair not found.' }, { status: 404 });
        }

        const updatedRate = await FxRate.findOneAndUpdate(
            { baseCurrency: baseCurrency.toUpperCase(), quoteCurrency: quoteCurrency.toUpperCase() },
            { $set: { isLocked } },
            { returnDocument: 'after' }
        );

        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await RateHistory.create({
            type: 'fx_rate',
            before,
            after: updatedRate,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: isLocked ? 'LOCK_RATE_PAIR' : 'UNLOCK_RATE_PAIR',
            targetType: 'FX_RATE',
            targetId: updatedRate._id.toString(),
            details: { baseCurrency, quoteCurrency, isLocked },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, message: `Pair ${baseCurrency}/${quoteCurrency} lock status set to ${isLocked}.`, data: updatedRate });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
