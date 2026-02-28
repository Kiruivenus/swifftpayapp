import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import FxRate from '@/models/FxRate';
import PlatformFeesLimits from '@/models/PlatformFeesLimits';
import ConversionControl from '@/models/ConversionControl';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import { sendPushNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 1. Check Global Conversion Freeze
        const control = await (ConversionControl as any).getSettings();
        if (control.conversionsFrozen) {
            return NextResponse.json({
                success: false,
                code: 'CONVERSIONS_FROZEN',
                message: control.freezeReason || 'Conversions are temporarily unavailable.'
            }, { status: 503 });
        }

        const { amount, fromCurrency } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ message: 'Amount must be greater than zero' }, { status: 400 });
        }

        const toCurrency = fromCurrency === 'USDT' ? 'KES' : 'USDT';

        // 2. Fetch Real Rate and Spread
        const [fxRate, feesLimits] = await Promise.all([
            FxRate.findOne({ baseCurrency: 'USDT', quoteCurrency: 'KES', isActive: true }),
            (PlatformFeesLimits as any).getSettings()
        ]);

        if (!fxRate) {
            return NextResponse.json({ message: 'Exchange rate not found for this pair' }, { status: 404 });
        }

        const baseRate = fxRate.rate;
        const spreadPercent = feesLimits.conversionSpreadPercent || 0;

        // Calculate effective rate with spread
        // If selling USDT (USDT -> KES): effectiveRate = baseRate * (1 - spread)
        // If buying USDT (KES -> USDT): effectiveRate = baseRate * (1 + spread)
        let effectiveRate = baseRate;
        if (fromCurrency === 'USDT') {
            effectiveRate = baseRate * (1 - (spreadPercent / 100));
        } else {
            effectiveRate = baseRate * (1 + (spreadPercent / 100));
        }

        const dbUser = await User.findById(user.id).session(session);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        let fromAmount = amount;
        let toAmount = 0;

        // Check balance based on direction
        if (fromCurrency === 'USDT') {
            if (dbUser.usdtBalance < amount) {
                return NextResponse.json({ message: 'Insufficient USDT balance' }, { status: 400 });
            }
            toAmount = amount * effectiveRate;
            dbUser.usdtBalance -= amount;
            dbUser.kesBalance += toAmount;
        } else {
            if (dbUser.kesBalance < amount) {
                return NextResponse.json({ message: 'Insufficient KES balance' }, { status: 400 });
            }
            toAmount = amount / effectiveRate;
            dbUser.kesBalance -= amount;
            dbUser.usdtBalance += toAmount;
        }

        await dbUser.save({ session });

        await Transaction.create([{
            userId: user.id,
            amount: fromAmount,
            currency: fromCurrency,
            secondaryAmount: toAmount,
            secondaryCurrency: toCurrency,
            type: 'CONVERT',
            status: 'SUCCESS',
            rate: effectiveRate, // Log the rate used
            createdAt: new Date()
        }], { session });

        await session.commitTransaction();

        // Trigger Notification (Async)
        sendPushNotification(
            user.id,
            "Conversion Success",
            `Swapped ${fromAmount} ${fromCurrency} for ${toAmount.toFixed(2)} ${toCurrency}`,
            'transactions'
        );

        return NextResponse.json({
            success: true,
            message: 'Conversion successful',
            fromCurrency,
            toCurrency,
            amount: fromAmount,
            received: toAmount,
            rate: effectiveRate
        });

    } catch (error: any) {
        await session.abortTransaction();
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        session.endSession();
    }
}
