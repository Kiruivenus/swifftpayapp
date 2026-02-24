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

        const { recipient_email, amount } = await req.json();

        if (amount <= 0) {
            return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
        }

        await dbConnect();

        // Find sender
        const sender = await User.findById(user.id).session(session);
        if (!sender || sender.balance < amount) {
            return NextResponse.json({ message: 'Insufficient balance' }, { status: 400 });
        }

        // Find recipient
        const recipient = await User.findOne({ email: recipient_email }).session(session);
        if (!recipient) {
            return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
        }

        if (sender.id === recipient.id) {
            return NextResponse.json({ message: 'Cannot transfer to yourself' }, { status: 400 });
        }

        // Update balances
        sender.balance -= amount;
        recipient.balance += amount;

        await sender.save();
        await recipient.save();

        // Create transaction records
        await Transaction.create([{
            userId: sender.id,
            recipientId: recipient.id,
            amount,
            type: 'TRANSFER_SEND',
            status: 'SUCCESS',
            createdAt: new Date()
        }], { session });

        await session.commitTransaction();
        return NextResponse.json({ message: 'Transfer successful' });

    } catch (error: any) {
        await session.abortTransaction();
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        session.endSession();
    }
}
