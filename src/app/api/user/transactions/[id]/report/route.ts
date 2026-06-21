import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import SecurityEvent from '@/models/SecurityEvent';
import { verifyAuth } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    
    try {
        await dbConnect();

        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { reason } = body;

        if (!reason || reason.trim().length < 5) {
            return NextResponse.json({ message: 'Please provide a valid report reason (min 5 characters).' }, { status: 400 });
        }

        // Find sender's transaction
        const tx = await Transaction.findById(id);
        if (!tx) {
            return NextResponse.json({ message: 'Transaction not found.' }, { status: 404 });
        }

        // Validate that user is the sender
        if (tx.userId !== user.id || tx.senderId !== user.id || tx.type !== 'TRANSFER_SEND') {
            return NextResponse.json({ message: 'Forbidden. You can only report transfers you have sent.' }, { status: 403 });
        }

        if (tx.status !== 'SUCCESS') {
            return NextResponse.json({ message: `Cannot report transaction with current status: ${tx.status}` }, { status: 400 });
        }

        // Query the corresponding recipient transaction
        // Match recipientId, senderId, amount, currency, and creation date window (within 10s)
        const rxTx = await Transaction.findOne({
            senderId: tx.senderId,
            recipientId: tx.recipientId,
            amount: tx.amount,
            currency: tx.currency,
            type: 'TRANSFER_RECEIVE',
            createdAt: {
                $gte: new Date(tx.createdAt.getTime() - 10000),
                $lte: new Date(tx.createdAt.getTime() + 10000)
            }
        });

        if (!rxTx) {
            return NextResponse.json({ message: 'Corresponding recipient transaction record not found.' }, { status: 404 });
        }

        // Query receiver to inspect available balance
        const receiver = await User.findById(rxTx.userId);
        if (!receiver) {
            return NextResponse.json({ message: 'Recipient account not found.' }, { status: 404 });
        }

        const balanceField = tx.currency === 'USDT' ? 'usdtBalance' : 'kesBalance';
        
        // Sum up recipient's pending withdrawals and already held received transfers
        const receiverAggregated = await Transaction.aggregate([
            {
                $match: {
                    userId: receiver._id.toString(),
                    currency: tx.currency,
                    $or: [
                        { type: 'WITHDRAW', status: { $in: ['PENDING', 'HOLD', 'ESCALATED'] } },
                        { type: 'TRANSFER_RECEIVE', status: { $in: ['HOLD', 'ESCALATED'] } }
                    ]
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const receiverLocked = receiverAggregated.length > 0 ? receiverAggregated[0].total : 0;
        const receiverAvailable = receiver[balanceField] - receiverLocked;

        // Check if transaction amount is still available
        if (receiverAvailable < tx.amount) {
            return NextResponse.json({
                message: 'Unable to hold transaction. The transferred funds are no longer available in the recipient\'s wallet.'
            }, { status: 400 });
        }

        // Put BOTH transactions on HOLD
        tx.status = 'HOLD';
        tx.isFlagged = true;
        tx.flagReason = `Disputed by sender: ${reason}`;
        await tx.save();

        rxTx.status = 'HOLD';
        rxTx.isFlagged = true;
        rxTx.flagReason = `Disputed by sender: ${reason}`;
        await rxTx.save();

        // Dispatch notifications
        const senderName = receiver.fullName || receiver.username || receiver.email;
        await sendNotification(
            tx.userId,
            'Transfer Placed on Hold',
            `Your transfer of ${tx.amount} ${tx.currency} to ${senderName} has been placed on hold following your dispute report.`,
            'FINANCE'
        );

        await sendNotification(
            rxTx.userId,
            'Received Transfer Held',
            `A transfer of ${rxTx.amount} ${rxTx.currency} received from ${tx.userId} has been locked on hold following a dispute report.`,
            'FINANCE'
        );

        // Security Event Log
        await SecurityEvent.create({
            type: 'TRANSACTION_DISPUTED',
            severity: 'medium',
            userId: tx.userId,
            message: `Sender reported transfer ${tx._id}. Placed both send/receive transactions on hold.`,
            metadata: {
                senderTxId: tx._id,
                receiverTxId: rxTx._id,
                amount: tx.amount,
                currency: tx.currency,
                reason
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Transaction reported. The amount has been put on hold pending review.'
        });

    } catch (err: any) {
        console.error('Report transaction error:', err);
        return NextResponse.json({ message: err.message || 'Something went wrong.' }, { status: 500 });
    }
}
