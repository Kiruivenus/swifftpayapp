import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import PlatformFeesLimits from '@/models/PlatformFeesLimits';
import { verifyAuth } from '@/lib/auth';
import { checkMaintenance } from '@/lib/maintenance';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Check Maintenance Mode
        const maintenance = await checkMaintenance();
        if (maintenance.isMaintenance) return maintenance.response!;

        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, phoneNumber, amount, network, toAddress } = body;
        const currency = body.currency || 'KES';

        if (!amount || amount <= 0) {
            return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
        }

        if (currency === 'KES' && (!name || !phoneNumber)) {
            return NextResponse.json({ message: 'Invalid KES withdrawal details' }, { status: 400 });
        }

        if (currency === 'USDT' && (!toAddress || !network)) {
            return NextResponse.json({ message: 'Invalid USDT withdrawal details' }, { status: 400 });
        }

        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // 2. Fetch Configurable Fees & Limits
        const feesLimits = await (PlatformFeesLimits as any).getSettings();

        // A. Min Withdrawal Check
        const minWithdraw = feesLimits.minWithdrawByCurrency?.[currency] || 0;
        if (amount < minWithdraw) {
            return NextResponse.json({
                message: `Minimum withdrawal for ${currency} is ${minWithdraw}`
            }, { status: 400 });
        }

        // B. Daily Limit Check
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const dailyVolume = await Transaction.aggregate([
            {
                $match: {
                    userId: user.id,
                    type: 'WITHDRAW',
                    currency: currency,
                    status: { $in: ['PENDING', 'SUCCESS'] },
                    createdAt: { $gte: startOfDay }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const currentDailyTotal = dailyVolume.length > 0 ? dailyVolume[0].total : 0;
        const dailyLimit = feesLimits.dailyLimitVerifiedByCurrency?.[currency] || 1000000;

        if (currentDailyTotal + amount > dailyLimit) {
            return NextResponse.json({
                message: `Daily withdrawal limit for ${currency} reached. Remaining: ${Math.max(0, dailyLimit - currentDailyTotal)}`
            }, { status: 400 });
        }

        // 3. Balance & Pending Check
        const pendingWithdrawals = await Transaction.aggregate([
            { $match: { userId: user.id, type: 'WITHDRAW', currency: currency, status: 'PENDING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmount = pendingWithdrawals.length > 0 ? pendingWithdrawals[0].total : 0;

        const balance = currency === 'KES' ? dbUser.kesBalance : dbUser.usdtBalance;
        const availableBalance = balance - pendingAmount;

        if (amount > availableBalance) {
            return NextResponse.json({ message: `Insufficient available ${currency} balance` }, { status: 400 });
        }

        // 4. Calculate Fee
        let fee = 0;
        if (currency === 'USDT') {
            fee = feesLimits.networkFeeUsdtFlat || 1.0;
        } else if (currency === 'KES') {
            fee = amount * ((feesLimits.withdrawalFeePercent || 1.5) / 100);
        }

        if (amount <= fee) {
            return NextResponse.json({ message: 'Amount must be greater than withdrawal fees' }, { status: 400 });
        }

        // 5. Create Transaction
        const transaction = await Transaction.create({
            userId: user.id,
            amount: amount,
            currency: currency,
            type: 'WITHDRAW',
            status: 'PENDING',
            phoneNumber: phoneNumber,
            recipientId: name,
            toAddress: toAddress,
            network: network,
            fee: fee,
            netAmount: amount - fee,
            createdAt: new Date()
        });

        return NextResponse.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            transactionId: transaction._id,
            fee,
            netAmount: amount - fee
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
