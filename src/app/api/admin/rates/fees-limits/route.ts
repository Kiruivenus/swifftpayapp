import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformFeesLimits from '@/models/PlatformFeesLimits';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function PUT(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const body = await req.json();

        await dbConnect();
        const settings = await (PlatformFeesLimits as any).getSettings();
        const before = JSON.parse(JSON.stringify(settings));

        // Legacy values validation & mapping
        if (body.withdrawalFeePercent !== undefined) {
            if (body.withdrawalFeePercent < 0) return NextResponse.json({ success: false, message: 'Fees cannot be negative.' }, { status: 400 });
            settings.withdrawalFeePercent = body.withdrawalFeePercent;
            settings.withdrawalFee = { type: 'percentage', value: body.withdrawalFeePercent, tiers: [] };
        }
        if (body.conversionSpreadPercent !== undefined) {
            if (body.conversionSpreadPercent < 0) return NextResponse.json({ success: false, message: 'Fees cannot be negative.' }, { status: 400 });
            settings.conversionSpreadPercent = body.conversionSpreadPercent;
            settings.conversionFee = { type: 'percentage', value: body.conversionSpreadPercent, tiers: [] };
        }
        if (body.networkFeeUsdtFlat !== undefined) {
            if (body.networkFeeUsdtFlat < 0) return NextResponse.json({ success: false, message: 'Fees cannot be negative.' }, { status: 400 });
            settings.networkFeeUsdtFlat = body.networkFeeUsdtFlat;
            settings.networkFee = { type: 'fixed', value: body.networkFeeUsdtFlat, tiers: [] };
        }

        // Expanded multi-mode fee mapping
        const keys = [
            'depositFee',
            'withdrawalFee',
            'transferFee',
            'conversionFee',
            'networkFee',
            'minDepositByCurrency',
            'minWithdrawByCurrency',
            'dailyLimitVerifiedByCurrency',
            'dailyLimitUnverifiedByCurrency',
            'regionalFees'
        ];

        keys.forEach(key => {
            if (body[key] !== undefined) {
                settings[key] = body[key];
            }
        });

        settings.updatedBy = admin.id;
        settings.updatedAt = new Date();
        await settings.save();

        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await RateHistory.create({
            type: 'fees_limits',
            before,
            after: settings,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'UPDATE_FEES_LIMITS',
            targetType: 'SYSTEM',
            targetId: 'GLOBAL',
            details: { before, after: settings },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, data: settings });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
