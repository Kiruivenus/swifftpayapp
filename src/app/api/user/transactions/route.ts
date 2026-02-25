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

        // With double-recording, we only need to fetch transactions where the user is the 'owner' (userId)
        // This ensures the 'type' (TRANSFER_SEND vs TRANSFER_RECEIVE) is correct for the specific user.
        const transactions = await Transaction.find({ userId: user.id })
            .sort({ createdAt: -1 })
            .limit(40);

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
            recipientId: tx.recipientId, // Pass numeric/raw ID as well
            senderId: tx.senderId,
            sender: tx.senderId || tx.userId, // Default to userId for older single-record entries
            network: tx.network,
            toAddress: tx.toAddress,
            fee: tx.fee,
            netAmount: tx.netAmount,
            phoneNumber: tx.phoneNumber
        }));

        return NextResponse.json(mappedTransactions);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
