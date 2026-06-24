import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FxRate from '@/models/FxRate';
import CurrencyPair from '@/models/CurrencyPair';
import ExchangeRate from '@/models/ExchangeRate';
import ExchangeFee from '@/models/ExchangeFee';
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

        const base = baseCurrency.toUpperCase();
        const quote = quoteCurrency.toUpperCase();

        await dbConnect();

        const before = await FxRate.findOne({ baseCurrency: base, quoteCurrency: quote });

        // 1. Sync FxRate
        const updatedRate = await FxRate.findOneAndUpdate(
            { baseCurrency: base, quoteCurrency: quote },
            {
                $set: {
                    rate,
                    source,
                    updatedBy: admin.id,
                    isActive: true
                }
            },
            { upsert: true, returnDocument: 'after' }
        );

        // 2. Sync CurrencyPair
        await CurrencyPair.findOneAndUpdate(
            { fromCurrency: base, toCurrency: quote },
            { $set: { isActive: true } },
            { upsert: true }
        );

        // 3. Sync ExchangeRate
        await ExchangeRate.findOneAndUpdate(
            { fromCurrency: base, toCurrency: quote },
            {
                $set: {
                    rate,
                    source,
                    isActive: true
                }
            },
            { upsert: true }
        );

        // 4. Ensure ExchangeFee exists
        await ExchangeFee.findOneAndUpdate(
            { fromCurrency: base, toCurrency: quote },
            {
                $setOnInsert: {
                    exchangeFeePercent: 0.5,
                    exchangeFeeFlat: 0,
                    networkFee: 0
                }
            },
            { upsert: true }
        );

        // Reciprocal pair sync (inverse rate)
        const reciprocalRate = 1.0 / rate;
        await CurrencyPair.findOneAndUpdate(
            { fromCurrency: quote, toCurrency: base },
            { $set: { isActive: true } },
            { upsert: true }
        );
        await ExchangeRate.findOneAndUpdate(
            { fromCurrency: quote, toCurrency: base },
            {
                $set: {
                    rate: reciprocalRate,
                    source,
                    isActive: true
                }
            },
            { upsert: true }
        );
        await ExchangeFee.findOneAndUpdate(
            { fromCurrency: quote, toCurrency: base },
            {
                $setOnInsert: {
                    exchangeFeePercent: 0.5,
                    exchangeFeeFlat: 0,
                    networkFee: 0
                }
            },
            { upsert: true }
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

        const from = base.toUpperCase();
        const to = quote.toUpperCase();

        await dbConnect();

        const deleted = await FxRate.findOneAndDelete({
            baseCurrency: from,
            quoteCurrency: to
        });

        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Rate pair not found' }, { status: 404 });
        }

        // Clean up pairing collections
        await CurrencyPair.findOneAndDelete({ fromCurrency: from, toCurrency: to });
        await ExchangeRate.findOneAndDelete({ fromCurrency: from, toCurrency: to });
        await ExchangeFee.findOneAndDelete({ fromCurrency: from, toCurrency: to });

        // Clean up reciprocal pairing as well
        await CurrencyPair.findOneAndDelete({ fromCurrency: to, toCurrency: from });
        await ExchangeRate.findOneAndDelete({ fromCurrency: to, toCurrency: from });
        await ExchangeFee.findOneAndDelete({ fromCurrency: to, toCurrency: from });

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
