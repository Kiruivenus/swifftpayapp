import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformFeesLimits from '@/models/PlatformFeesLimits';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function PUT(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const body = await req.json();

        // We expect a full or partial object of fees/limits
        await dbConnect();
        const settings = await (PlatformFeesLimits as any).getSettings();
        const before = JSON.parse(JSON.stringify(settings));

        // Validation for numbers
        if (body.withdrawalFeePercent < 0 || body.conversionSpreadPercent < 0 || body.networkFeeUsdtFlat < 0) {
            return NextResponse.json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Fees cannot be negative.'
            }, { status: 400 });
        }

        // Apply changes
        Object.keys(body).forEach(key => {
            if (settings[key] !== undefined) {
                settings[key] = body[key];
            }
        });

        settings.updatedBy = admin.id;
        settings.updatedAt = new Date();
        await settings.save();

        // Write History
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

        return NextResponse.json({ success: true, data: settings });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
