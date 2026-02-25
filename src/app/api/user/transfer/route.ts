import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { recipient, recipient_type, amount, currency, pin } = await req.json();

        if (amount <= 0) {
            return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
        }

        await dbConnect();

        // Find sender
        const sender = await User.findById(user.id).session(session);
        if (!sender) {
            return NextResponse.json({ message: 'Sender not found' }, { status: 404 });
        }

        // Verify PIN if set
        if (sender.isPinSet) {
            if (!pin) {
                return NextResponse.json({ message: 'PIN required for this transaction' }, { status: 403 });
            }
            const isPinValid = await bcrypt.compare(pin, sender.pinHash);
            if (!isPinValid) {
                return NextResponse.json({ message: 'Invalid transaction PIN' }, { status: 403 });
            }
        }

        // Calculate pending withdrawals for the specific currency
        const pendingWithdrawals = await Transaction.aggregate([
            { $match: { userId: user.id, type: 'WITHDRAW', currency: currency, status: 'PENDING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmount = pendingWithdrawals.length > 0 ? pendingWithdrawals[0].total : 0;

        // Check availability
        const balanceField = currency === 'USDT' ? 'usdtBalance' : 'kesBalance';
        const availableBalance = sender[balanceField] - pendingAmount;

        if (availableBalance < amount) {
            return NextResponse.json({ message: `Insufficient available ${currency} balance (Pending withdrawals: ${pendingAmount})` }, { status: 400 });
        }

        // Find recipient
        let recipientUser;
        if (recipient_type === 'EMAIL') {
            recipientUser = await User.findOne({ email: recipient }).session(session);
        } else {
            recipientUser = await User.findById(recipient).session(session);
        }

        if (!recipientUser) {
            return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
        }

        if (sender.id === recipientUser.id) {
            return NextResponse.json({ message: 'Cannot transfer to yourself' }, { status: 400 });
        }

        // Update balances
        sender[balanceField] -= amount;
        recipientUser[balanceField] += amount;

        await sender.save();
        await recipientUser.save();

        // Create TWO transaction records: one for sender, one for recipient
        await Transaction.create([
            {
                userId: sender.id, // Record for the sender
                senderId: sender.id,
                recipientId: recipientUser.id,
                amount,
                currency,
                type: 'TRANSFER_SEND',
                status: 'SUCCESS',
                createdAt: new Date()
            },
            {
                userId: recipientUser.id, // Record for the recipient
                senderId: sender.id,
                recipientId: recipientUser.id,
                amount,
                currency,
                type: 'TRANSFER_RECEIVE',
                status: 'SUCCESS',
                createdAt: new Date()
            }
        ], { session });

        await session.commitTransaction();
        return NextResponse.json({ message: 'Transfer successful' });

    } catch (error: any) {
        await session.abortTransaction();
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        session.endSession();
    }
}
