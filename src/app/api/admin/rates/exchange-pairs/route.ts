import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CurrencyPair from '@/models/CurrencyPair';
import ExchangeRate from '@/models/ExchangeRate';
import ExchangeFee from '@/models/ExchangeFee';
import ExchangeLimit from '@/models/ExchangeLimit';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        await dbConnect();

        const [pairs, rates, fees, limits] = await Promise.all([
            CurrencyPair.find().sort({ fromCurrency: 1, toCurrency: 1 }),
            ExchangeRate.find(),
            ExchangeFee.find(),
            ExchangeLimit.find()
        ]);

        const mappedPairs = pairs.map(pair => {
            const from = pair.fromCurrency.toUpperCase();
            const to = pair.toCurrency.toUpperCase();

            const rateObj = rates.find(r => r.fromCurrency === from && r.toCurrency === to);
            const feeObj = fees.find(f => f.fromCurrency === from && f.toCurrency === to);
            const limitObj = limits.find(l => l.currency === from);

            return {
                id: pair._id,
                fromCurrency: from,
                toCurrency: to,
                isActive: pair.isActive,
                rate: rateObj ? rateObj.rate : 1.0,
                changePercentage: rateObj ? rateObj.changePercentage : 0.0,
                exchangeFeePercent: feeObj ? feeObj.exchangeFeePercent : 0.0,
                exchangeFeeFlat: feeObj ? feeObj.exchangeFeeFlat : 0.0,
                networkFee: feeObj ? feeObj.networkFee : 0.0,
                minLimit: limitObj ? limitObj.minLimit : 0.0,
                maxLimit: limitObj ? limitObj.maxLimit : 1000000.0,
                dailyLimit: limitObj ? limitObj.dailyLimit : 5000000.0
            };
        });

        return NextResponse.json({ success: true, pairs: mappedPairs });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const body = await req.json();
        const {
            fromCurrency,
            toCurrency,
            isActive = true,
            rate,
            exchangeFeePercent = 0,
            exchangeFeeFlat = 0,
            networkFee = 0,
            minLimit = 0,
            maxLimit = 1000000,
            dailyLimit = 5000000
        } = body;

        if (!fromCurrency || !toCurrency) {
            return NextResponse.json({ success: false, message: 'Missing fromCurrency or toCurrency.' }, { status: 400 });
        }

        const from = fromCurrency.toUpperCase();
        const to = toCurrency.toUpperCase();

        await dbConnect();

        // 1. Upsert CurrencyPair
        const pair = await CurrencyPair.findOneAndUpdate(
            { fromCurrency: from, toCurrency: to },
            { $set: { isActive } },
            { upsert: true, new: true }
        );

        // 2. Upsert ExchangeRate (if rate is provided)
        if (rate !== undefined && rate > 0) {
            await ExchangeRate.findOneAndUpdate(
                { fromCurrency: from, toCurrency: to },
                {
                    $set: {
                        rate,
                        isActive,
                        source: 'manual'
                    }
                },
                { upsert: true }
            );

            // Reciprocal pair sync (inverse rate)
            const reciprocalRate = 1.0 / rate;
            await CurrencyPair.findOneAndUpdate(
                { fromCurrency: to, toCurrency: from },
                { $set: { isActive } },
                { upsert: true }
            );
            await ExchangeRate.findOneAndUpdate(
                { fromCurrency: to, toCurrency: from },
                {
                    $set: {
                        rate: reciprocalRate,
                        isActive,
                        source: 'manual'
                    }
                },
                { upsert: true }
            );
        }

        // 3. Upsert ExchangeFee
        const fee = await ExchangeFee.findOneAndUpdate(
            { fromCurrency: from, toCurrency: to },
            {
                $set: {
                    exchangeFeePercent,
                    exchangeFeeFlat,
                    networkFee
                }
            },
            { upsert: true, new: true }
        );

        // Reciprocal fee sync (copy fee settings by default for simplicity)
        await ExchangeFee.findOneAndUpdate(
            { fromCurrency: to, toCurrency: from },
            {
                $set: {
                    exchangeFeePercent,
                    exchangeFeeFlat,
                    networkFee
                }
            },
            { upsert: true }
        );

        // 4. Upsert ExchangeLimit for source currency
        const limit = await ExchangeLimit.findOneAndUpdate(
            { currency: from },
            {
                $set: {
                    minLimit,
                    maxLimit,
                    dailyLimit
                }
            },
            { upsert: true, new: true }
        );

        // Audit log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'UPDATE_EXCHANGE_PAIR',
            targetType: 'SYSTEM',
            targetId: `${from}/${to}`,
            details: { rate, exchangeFeePercent, networkFee, minLimit, maxLimit, dailyLimit, isActive },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({
            success: true,
            pair,
            fee,
            limit
        });

    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
