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
            currency: tx.currency,
            secondaryAmount: tx.secondaryAmount,
            secondaryCurrency: tx.secondaryCurrency,
            type: tx.type,
            status: tx.status,
            date: new Date(tx.createdAt).toLocaleDateString(),
            recipient: tx.recipientId,
            sender: tx.userId
        }));

        return NextResponse.json(mappedTransactions);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
