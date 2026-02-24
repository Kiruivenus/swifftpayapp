import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Find transactions where user is either the sender (userId) or recipient (recipientId for transfers)
        const transactions = await Transaction.find({
            $or: [
                { userId: user.id },
                { recipientId: user.id }
            ]
        }).sort({ createdAt: -1 }).limit(20);

        // Map to the format expected by the Android app
        const mappedTransactions = transactions.map(tx => ({
            id: tx._id,
            amount: tx.amount,
            type: tx.type === 'DEPOSIT' || (tx.type === 'TRANSFER_RECEIVE' && tx.recipientId === user.id) ? 'RECEIVE' : 'SEND',
            status: tx.status,
            date: new Date(tx.createdAt).toLocaleDateString(),
            recipient: tx.recipientId, // You might want to populate this with usernames later
            sender: tx.userId
        }));

        return NextResponse.json(mappedTransactions);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
