import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { recipient, recipient_type, amount, currency, pin } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find sender
            const sender = await User.findById(user.id).session(session);
            if (!sender) {
                await session.abortTransaction();
                return NextResponse.json({ message: 'Sender not found' }, { status: 404 });
            }

            // Verify PIN if set
            if (sender.isPinSet) {
                if (!pin) {
                    await session.abortTransaction();
                    return NextResponse.json({ message: 'PIN required for this transaction' }, { status: 403 });
                }
                const isPinValid = await bcrypt.compare(pin, sender.pinHash);
                if (!isPinValid) {
                    await session.abortTransaction();
                    return NextResponse.json({ message: 'Invalid transaction PIN' }, { status: 403 });
                }
            }

            // Calculate locked amounts for the specific currency (pending/held/escalated withdrawals + held/escalated received transfers)
            const aggregated = await Transaction.aggregate([
                {
                    $match: {
                        userId: user.id,
                        currency: currency,
                        $or: [
                            { type: 'WITHDRAW', status: { $in: ['PENDING', 'HOLD', 'ESCALATED'] } },
                            { type: 'TRANSFER_RECEIVE', status: { $in: ['HOLD', 'ESCALATED'] } }
                        ]
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]).session(session);
            const pendingAmount = aggregated.length > 0 ? aggregated[0].total : 0;

            // Check availability
            const balanceField = currency === 'USDT' ? 'usdtBalance' : 'kesBalance';
            const availableBalance = sender[balanceField] - pendingAmount;

            if (availableBalance < amount) {
                await session.abortTransaction();
                return NextResponse.json({ message: `Insufficient available ${currency} balance. Available: ${availableBalance}` }, { status: 400 });
            }

            // Find recipient
            let recipientUser;
            const cleanRecipient = recipient.trim().toLowerCase();
            if (recipient_type === 'EMAIL') {
                recipientUser = await User.findOne({ emailNormalized: cleanRecipient }).session(session);
            } else {
                recipientUser = await User.findById(recipient).session(session);
            }

            if (!recipientUser) {
                await session.abortTransaction();
                return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
            }

            if (sender._id.toString() === recipientUser._id.toString()) {
                await session.abortTransaction();
                return NextResponse.json({ message: 'Cannot transfer to yourself' }, { status: 400 });
            }

            // Update balances
            sender[balanceField] -= Number(amount);
            recipientUser[balanceField] += Number(amount);

            await sender.save({ session });
            await recipientUser.save({ session });

            // Create TWO transaction records: one for sender, one for recipient
            const senderName = sender.fullName || sender.username || sender.email;
            const recipientName = recipientUser.fullName || recipientUser.username || recipientUser.email;
            const senderIdStr = sender._id.toString();
            const recipientIdStr = recipientUser._id.toString();

            const createdTxs = await Transaction.create([
                {
                    userId: senderIdStr,
                    senderId: senderIdStr,
                    sender: senderName,
                    recipientId: recipientIdStr,
                    recipient: recipientName,
                    amount: Number(amount),
                    currency,
                    type: 'TRANSFER_SEND',
                    status: 'SUCCESS',
                    createdAt: new Date()
                },
                {
                    userId: recipientIdStr,
                    senderId: senderIdStr,
                    sender: senderName,
                    recipientId: recipientIdStr,
                    recipient: recipientName,
                    amount: Number(amount),
                    currency,
                    type: 'TRANSFER_RECEIVE',
                    status: 'SUCCESS',
                    createdAt: new Date()
                }
            ], { session, ordered: true });

            const senderTx = createdTxs[0];

            await session.commitTransaction();

            // Check and process referral requirements
            try {
                const { checkAndProcessReferral } = await import('@/lib/referralEngine');
                await checkAndProcessReferral(senderIdStr);
            } catch (refErr) {
                console.error('Referral processing error during transfer:', refErr);
            }

            // Trigger Notifications (Async)
            await sendNotification(
                senderIdStr,
                "Transaction Alert",
                `Transfer of ${amount} ${currency} to ${recipientUser.fullName || recipientUser.username || recipientUser.email} was successful. Ref Id: ${senderTx._id.toString()}`,
                'FINANCE',
                { refId: senderTx._id.toString() }
            );
            await sendNotification(
                recipientIdStr,
                "Transaction Alert",
                `You have received ${amount} ${currency} from ${sender.fullName || sender.username || sender.email}. Ref Id: ${senderTx._id.toString()}`,
                'FINANCE',
                { refId: senderTx._id.toString() }
            );

            return NextResponse.json({
                message: 'Transfer successful',
                reference: senderTx._id.toString(),
                createdAt: senderTx.createdAt
            });

        } catch (error: any) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            console.error('Transfer Transaction Error:', error);
            return NextResponse.json({ message: error.message || 'Transaction failed' }, { status: 500 });
        } finally {
            session.endSession();
        }

    } catch (error: any) {
        console.error('Transfer API Outer Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
