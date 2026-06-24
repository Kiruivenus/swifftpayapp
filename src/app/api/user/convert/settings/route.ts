import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Currency from '@/models/Currency';
import CurrencyPair from '@/models/CurrencyPair';
import ExchangeRate from '@/models/ExchangeRate';
import ExchangeFee from '@/models/ExchangeFee';
import ExchangeLimit from '@/models/ExchangeLimit';
import Transaction from '@/models/Transaction';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Fetch all enabled currencies
        const currenciesList = await Currency.find({ enabled: true }).sort({ code: 1 });

        // Fetch all active pairs, rates, fees, and limits
        const [pairs, rates, fees, limits] = await Promise.all([
            CurrencyPair.find({ isActive: true }),
            ExchangeRate.find({ isActive: true }),
            ExchangeFee.find(),
            ExchangeLimit.find()
        ]);

        // Calculate pending amount per currency (withdrawals that are pending/hold/escalated)
        const pendingAmountAggr = await Transaction.aggregate([
            {
                $match: {
                    userId: user.id,
                    status: { $in: ['PENDING', 'HOLD', 'ESCALATED'] },
                    type: 'WITHDRAW'
                }
            },
            {
                $group: {
                    _id: '$currency',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const pendingMap: { [key: string]: number } = {};
        pendingAmountAggr.forEach(item => {
            pendingMap[item._id] = item.total;
        });

        // Map currencies to include user balance & available balance
        const mappedCurrencies = currenciesList.map(curr => {
            const code = curr.code.toUpperCase();
            let balance = 0;
            if (code === 'KES') {
                balance = dbUser.kesBalance || 0;
            } else if (code === 'USDT') {
                balance = dbUser.usdtBalance || 0;
            } else {
                balance = (dbUser.balances && dbUser.balances.get(code)) || 0;
            }

            const pending = pendingMap[code] || 0;
            const availableBalance = Math.max(0, balance - pending);

            return {
                id: curr._id,
                code,
                name: curr.name,
                symbol: curr.symbol,
                precision: curr.precision,
                iconUrl: curr.iconUrl || '',
                isCrypto: curr.isCrypto || false,
                balance,
                availableBalance,
                pending
            };
        });

        // Map pairs with rates, fees, and limits
        const mappedPairs = pairs.map(pair => {
            const from = pair.fromCurrency.toUpperCase();
            const to = pair.toCurrency.toUpperCase();

            // Find matching rate
            const rateObj = rates.find(r => r.fromCurrency === from && r.toCurrency === to);
            const rate = rateObj ? rateObj.rate : 1.0;
            const changePercentage = rateObj ? rateObj.changePercentage : 0.0;

            // Find matching fee
            const feeObj = fees.find(f => f.fromCurrency === from && f.toCurrency === to);
            const feePercent = feeObj ? feeObj.exchangeFeePercent : 0.0;
            const feeFlat = feeObj ? feeObj.exchangeFeeFlat : 0.0;
            const networkFee = feeObj ? feeObj.networkFee : 0.0;

            // Find matching limits
            const limitObj = limits.find(l => l.currency === from);
            const minLimit = limitObj ? limitObj.minLimit : 0.0;
            const maxLimit = limitObj ? limitObj.maxLimit : 1000000.0;
            const dailyLimit = limitObj ? limitObj.dailyLimit : 5000000.0;

            return {
                id: pair._id,
                fromCurrency: from,
                toCurrency: to,
                rate,
                changePercentage,
                exchangeFeePercent: feePercent,
                exchangeFeeFlat: feeFlat,
                networkFee,
                minLimit,
                maxLimit,
                dailyLimit
            };
        });

        return NextResponse.json({
            success: true,
            currencies: mappedCurrencies,
            pairs: mappedPairs
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
