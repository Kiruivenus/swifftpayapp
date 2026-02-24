import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { amount, rate } = await req.json(); // amount in USDT

        if (amount <= 0) {
            return NextResponse.json({ message: 'Amount must be greater than zero' }, { status: 400 });
        }

        await dbConnect();

        const dbUser = await User.findById(user.id).session(session);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (dbUser.usdtBalance < amount) {
            return NextResponse.json({ message: 'Insufficient USDT balance' }, { status: 400 });
        }

        const kesAmount = amount * rate;

        // Update balances
        dbUser.usdtBalance -= amount;
        dbUser.kesBalance += kesAmount;

        await dbUser.save();

        // Create conversion transaction
        await Transaction.create([{
            userId: user.id,
            amount: amount,
            currency: 'USDT',
            secondaryAmount: kesAmount,
            secondaryCurrency: 'KES',
            type: 'CONVERT',
            status: 'SUCCESS',
            createdAt: new Date()
        }], { session });

        await session.commitTransaction();
        return NextResponse.json({
            message: 'Conversion successful',
            usdtAmount: amount,
            kesAmount: kesAmount,
            rate: rate
        });

    } catch (error: any) {
        await session.abortTransaction();
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        session.endSession();
    }
}
