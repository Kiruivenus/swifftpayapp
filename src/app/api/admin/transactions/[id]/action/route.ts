import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.FLAG_TRANSACTIONS);
    if (error) return error;

    const { id } = await context.params;

    try {
        const body = await req.json();
        const { action, reason } = body;

        if (!action || !['HOLD', 'REVERSE', 'RESOLVE_FAVOR_RECEIVER'].includes(action)) {
            return NextResponse.json({ message: 'Invalid action. Supported: HOLD, REVERSE, RESOLVE_FAVOR_RECEIVER' }, { status: 400 });
        }

        if (!reason || reason.trim().length < 5) {
            return NextResponse.json({ message: 'Please provide a valid reason (min 5 characters).' }, { status: 400 });
        }

        await dbConnect();

        // 1. Find the target transaction
        const targetTx = await Transaction.findById(id);
        if (!targetTx) {
            return NextResponse.json({ message: 'Transaction not found.' }, { status: 404 });
        }

        if (targetTx.type !== 'TRANSFER_SEND' && targetTx.type !== 'TRANSFER_RECEIVE') {
            return NextResponse.json({ message: 'This action is only supported for peer-to-peer transfers.' }, { status: 400 });
        }

        // Identify sender & receiver IDs and the two transaction records
        const senderId = targetTx.senderId;
        const recipientId = targetTx.recipientId;
        const amount = targetTx.amount;
        const currency = targetTx.currency;

        // Fetch both transactions (TRANSFER_SEND and TRANSFER_RECEIVE)
        const sendTx = await Transaction.findOne({
            senderId,
            recipientId,
            amount,
            currency,
            type: 'TRANSFER_SEND',
            createdAt: {
                $gte: new Date(targetTx.createdAt.getTime() - 15000),
                $lte: new Date(targetTx.createdAt.getTime() + 15000)
            }
        });

        const recvTx = await Transaction.findOne({
            senderId,
            recipientId,
            amount,
            currency,
            type: 'TRANSFER_RECEIVE',
            createdAt: {
                $gte: new Date(targetTx.createdAt.getTime() - 15000),
                $lte: new Date(targetTx.createdAt.getTime() + 15000)
            }
        });

        if (!sendTx || !recvTx) {
            return NextResponse.json({ message: 'Could not locate matched transfer pair transaction records.' }, { status: 404 });
        }

        const sender = await User.findById(senderId);
        const receiver = await User.findById(recipientId);

        if (!sender || !receiver) {
            return NextResponse.json({ message: 'Sender or recipient user account not found.' }, { status: 404 });
        }

        const balanceField = currency === 'USDT' ? 'usdtBalance' : 'kesBalance';
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        // 2. Process Actions
        if (action === 'HOLD') {
            if (sendTx.status !== 'SUCCESS') {
                return NextResponse.json({ message: `Cannot place on hold. Current status: ${sendTx.status}` }, { status: 400 });
            }

            // Check receiver available balance
            const receiverAggregated = await Transaction.aggregate([
                {
                    $match: {
                        userId: receiver._id.toString(),
                        currency,
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

            if (receiverAvailable < amount) {
                return NextResponse.json({ message: 'Receiver has insufficient available balance to place a hold on this transfer.' }, { status: 400 });
            }

            sendTx.status = 'HOLD';
            sendTx.isFlagged = true;
            sendTx.flagReason = `Placed on hold by admin: ${reason}`;
            await sendTx.save();

            recvTx.status = 'HOLD';
            recvTx.isFlagged = true;
            recvTx.flagReason = `Placed on hold by admin: ${reason}`;
            await recvTx.save();

            // Notifications
            await sendNotification(senderId, 'Transfer Placed on Hold', `Your transfer of ${amount} ${currency} has been put on hold by administration.`, 'FINANCE');
            await sendNotification(recipientId, 'Received Transfer Held', `A transfer of ${amount} ${currency} received from ${sender.username} has been put on hold by administration.`, 'FINANCE');

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'HOLD_TRANSFER',
                targetType: 'TRANSACTION',
                targetId: sendTx._id.toString(),
                details: { senderId, recipientId, amount, currency, reason },
                ipAddress: ip,
                userAgent: ua,
                severity: 'WARNING'
            });

            return NextResponse.json({ success: true, message: 'Transfer pair placed on hold.' });

        } else if (action === 'REVERSE') {
            if (sendTx.status !== 'HOLD' && sendTx.status !== 'SUCCESS') {
                return NextResponse.json({ message: `Cannot reverse transfer with current status: ${sendTx.status}` }, { status: 400 });
            }

            // Deduct from receiver's total balance, refund sender's total balance
            if (receiver[balanceField] < amount) {
                return NextResponse.json({ message: `Recipient has insufficient total balance (${receiver[balanceField]} ${currency}) to reverse this transfer.` }, { status: 400 });
            }

            receiver[balanceField] = Math.max(0, receiver[balanceField] - amount);
            sender[balanceField] = (sender[balanceField] || 0) + amount;

            await receiver.save();
            await sender.save();

            sendTx.status = 'REVERSED';
            sendTx.isFlagged = false;
            sendTx.rejectionReason = `Reversed by admin: ${reason}`;
            await sendTx.save();

            recvTx.status = 'REVERSED';
            recvTx.isFlagged = false;
            recvTx.rejectionReason = `Reversed by admin: ${reason}`;
            await recvTx.save();

            // Notifications
            await sendNotification(senderId, 'Dispute Resolved: Refunded', `Your reported transfer of ${amount} ${currency} has been reversed. Funds have been refunded to your wallet.`, 'FINANCE');
            await sendNotification(recipientId, 'Transfer Reversed', `The transfer of ${amount} ${currency} received from ${sender.username} has been reversed by administration.`, 'FINANCE');

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'REVERSE_TRANSFER',
                targetType: 'TRANSACTION',
                targetId: sendTx._id.toString(),
                details: { senderId, recipientId, amount, currency, reason, senderNewBalance: sender[balanceField], receiverNewBalance: receiver[balanceField] },
                ipAddress: ip,
                userAgent: ua,
                severity: 'CRITICAL'
            });

            return NextResponse.json({ success: true, message: 'Transfer reversed. Balances adjusted successfully.' });

        } else if (action === 'RESOLVE_FAVOR_RECEIVER') {
            if (sendTx.status !== 'HOLD') {
                return NextResponse.json({ message: 'Only held transactions can be resolved in favor of the receiver.' }, { status: 400 });
            }

            sendTx.status = 'SUCCESS';
            sendTx.isFlagged = false;
            sendTx.flagReason = '';
            await sendTx.save();

            recvTx.status = 'SUCCESS';
            recvTx.isFlagged = false;
            recvTx.flagReason = '';
            await recvTx.save();

            // Notifications
            await sendNotification(senderId, 'Dispute Resolved', `Your dispute for transfer Ref ${sendTx._id.toString().slice(-8)} has been reviewed and closed by admin.`, 'FINANCE');
            await sendNotification(recipientId, 'Locked Funds Released', `The hold on your received transfer of ${amount} ${currency} has been released. The funds are now available.`, 'FINANCE');

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'RESOLVE_TRANSFER_FAVOR_RECEIVER',
                targetType: 'TRANSACTION',
                targetId: sendTx._id.toString(),
                details: { senderId, recipientId, amount, currency, reason },
                ipAddress: ip,
                userAgent: ua,
                severity: 'INFO'
            });

            return NextResponse.json({ success: true, message: 'Dispute resolved in favor of receiver. Hold released.' });
        }

    } catch (err: any) {
        console.error('Admin transaction action error:', err);
        return NextResponse.json({ message: err.message || 'Something went wrong.' }, { status: 500 });
    }
}
