import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
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

        await dbConnect();
        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Calculate pending withdrawals for the specific currency
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

        let fee = 0;
        if (currency === 'USDT') {
            fee = 1.0; // Fixed fee for TRC20 for now, or fetch from settings
            if (amount <= fee) {
                return NextResponse.json({ message: 'Amount must be greater than network fee' }, { status: 400 });
            }
        }

        // Create the withdrawal transaction
        const transaction = await Transaction.create({
            userId: user.id,
            amount: amount,
            currency: currency || 'KES',
            type: 'WITHDRAW',
            status: 'PENDING',
            phoneNumber: phoneNumber, // M-PESA number
            recipientId: name, // M-PESA Name
            toAddress: toAddress,
            network: network,
            fee: fee,
            netAmount: amount - fee
        });

        return NextResponse.json({
            message: 'Withdrawal request submitted successfully',
            transactionId: transaction._id
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
