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

        const transactions = await Transaction.find({ userId: user.id })
            .sort({ createdAt: -1 })
            .limit(100);

        // Fetch related user details to display full names and profile photos
        const userIds = new Set<string>();
        transactions.forEach(tx => {
            if (tx.senderId) userIds.add(tx.senderId);
            if (tx.recipientId) userIds.add(tx.recipientId);
        });

        const User = (await import('@/models/User')).default;
        const users = await User.find({ _id: { $in: Array.from(userIds) } })
            .select('fullName username email profilePhotoUrl');

        const userMap = new Map<string, any>();
        users.forEach(u => {
            userMap.set(u._id.toString(), u);
        });

        // Map to the format expected by the Android app
        const mappedTransactions = transactions.map(tx => {
            const senderUser = tx.senderId ? userMap.get(tx.senderId) : null;
            const recipientUser = tx.recipientId ? userMap.get(tx.recipientId) : null;

            return {
                id: tx._id.toString(),
                amount: tx.amount,
                currency: tx.currency,
                secondaryAmount: tx.secondaryAmount,
                secondaryCurrency: tx.secondaryCurrency,
                type: tx.type,
                status: tx.status,
                date: new Date(tx.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
                
                // Receiver/Sender full name or username display info
                sender: senderUser 
                    ? (senderUser.fullName || senderUser.username || senderUser.email)
                    : (tx.senderId || "SwiftPay User"),
                senderId: tx.senderId,
                senderUsername: senderUser?.username || "",
                senderEmail: senderUser?.email || "",
                senderProfilePhoto: senderUser?.profilePhotoUrl || "",
                
                recipient: recipientUser
                    ? (recipientUser.fullName || recipientUser.username || recipientUser.email)
                    : (tx.recipientId || "SwiftPay User"),
                recipientId: tx.recipientId,
                recipientUsername: recipientUser?.username || "",
                recipientEmail: recipientUser?.email || "",
                recipientProfilePhoto: recipientUser?.profilePhotoUrl || "",

                network: tx.network,
                toAddress: tx.toAddress,
                fee: tx.fee,
                netAmount: tx.netAmount,
                phoneNumber: tx.phoneNumber,
                description: tx.mpesaReceiptNumber ? `M-Pesa Receipt: ${tx.mpesaReceiptNumber}` : (tx.flagReason || "")
            };
        });

        return NextResponse.json(mappedTransactions);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
