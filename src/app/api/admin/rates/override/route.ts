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
        const { baseCurrency, quoteCurrency, rate } = body;

        if (!baseCurrency || !quoteCurrency || !rate || typeof rate !== 'number' || rate <= 0) {
            return NextResponse.json({
                success: false,
                message: 'Invalid rate or currency specifications.'
            }, { status: 400 });
        }

        await dbConnect();

        const before = await FxRate.findOne({
            baseCurrency: baseCurrency.toUpperCase(),
            quoteCurrency: quoteCurrency.toUpperCase()
        });

        const updatedRate = await FxRate.findOneAndUpdate(
            { baseCurrency: baseCurrency.toUpperCase(), quoteCurrency: quoteCurrency.toUpperCase() },
            {
                $set: {
                    rate,
                    source: 'manual_override',
                    updatedBy: admin.id,
                    isActive: true
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        // Audit & History logging
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await RateHistory.create({
            type: 'fx_rate',
            before: before || null,
            after: updatedRate,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'MANUAL_RATE_OVERRIDE',
            targetType: 'FX_RATE',
            targetId: updatedRate._id.toString(),
            details: {
                baseCurrency,
                quoteCurrency,
                oldRate: before ? before.rate : null,
                newRate: rate
            },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({
            success: true,
            message: `Exchange rate for ${baseCurrency} to ${quoteCurrency} set to ${rate} successfully.`,
            data: updatedRate
        });

    } catch (err: any) {
        console.error('Rate override error:', err);
        return NextResponse.json({ success: false, message: err.message || 'Something went wrong.' }, { status: 500 });
    }
}
