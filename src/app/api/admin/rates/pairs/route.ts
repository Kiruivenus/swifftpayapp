import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FxRate from '@/models/FxRate';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const body = await req.json();
        const { baseCurrency, quoteCurrency, rate, source = 'manual' } = body;

        if (!baseCurrency || !quoteCurrency || !rate || rate <= 0) {
            return NextResponse.json({
                success: false,
                code: 'VALIDATION_ERROR',
                message: 'Invalid rate or currency pair.'
            }, { status: 400 });
        }

        await dbConnect();

        const before = await FxRate.findOne({ baseCurrency, quoteCurrency });

        const updatedRate = await FxRate.findOneAndUpdate(
            { baseCurrency, quoteCurrency },
            {
                $set: {
                    rate,
                    source,
                    updatedBy: admin.id,
                    isActive: true
                }
            },
            { upsert: true, new: true }
        );

        // Write History
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

        return NextResponse.json({ success: true, data: updatedRate });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const { searchParams } = new URL(req.url);
        const base = searchParams.get('base');
        const quote = searchParams.get('quote');

        if (!base || !quote) {
            return NextResponse.json({ success: false, message: 'Missing base or quote currency' }, { status: 400 });
        }

        await dbConnect();

        const deleted = await FxRate.findOneAndDelete({
            baseCurrency: base.toUpperCase(),
            quoteCurrency: quote.toUpperCase()
        });

        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Rate pair not found' }, { status: 404 });
        }

        // Write History
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await RateHistory.create({
            type: 'fx_rate_deleted',
            before: deleted,
            after: null,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        return NextResponse.json({ success: true, message: 'Rate pair deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
