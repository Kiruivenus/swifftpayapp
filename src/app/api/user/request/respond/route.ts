import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import MoneyRequest from '@/models/MoneyRequest';
import Transaction from '@/models/Transaction';
import { verifyAuth } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { requestId, action, pin } = await req.json();

        if (!requestId || !action) {
            return NextResponse.json({ message: 'Missing parameters' }, { status: 400 });
        }

        const moneyRequest = await MoneyRequest.findById(requestId);
        if (!moneyRequest) {
            return NextResponse.json({ message: 'Money request not found' }, { status: 404 });
        }

        // Verify the user responding is the actual payer
        if (moneyRequest.payerId.toString() !== user.id) {
            return NextResponse.json({ message: 'Unauthorized response for this request' }, { status: 403 });
        }

        if (moneyRequest.status !== 'PENDING') {
            return NextResponse.json({ message: 'Request has already been processed' }, { status: 400 });
        }

        const payer = await User.findById(moneyRequest.payerId);
        const requester = await User.findById(moneyRequest.requesterId);

        if (!payer || !requester) {
            return NextResponse.json({ message: 'Payer or requester not found' }, { status: 404 });
        }

        if (action === 'DECLINE') {
            moneyRequest.status = 'DECLINED';
            moneyRequest.updatedAt = new Date();
            await moneyRequest.save();

            // Notify requester
            const payerName = payer.fullName || payer.username || payer.email;
            await sendNotification(
                moneyRequest.requesterId.toString(),
                "Money Request Declined",
                `${payerName} declined your request for ${moneyRequest.amount} ${moneyRequest.currency}.`,
                "FINANCE",
                { push: true, inApp: true, email: true }
            );

            return NextResponse.json({ message: 'Request declined successfully' });
        }

        if (action === 'ACCEPT') {
            // PIN check
            if (payer.isPinSet) {
                if (!pin) {
                    return NextResponse.json({ message: 'PIN required to accept this request' }, { status: 403 });
                }
                const isPinValid = await bcrypt.compare(pin, payer.pinHash);
                if (!isPinValid) {
                    return NextResponse.json({ message: 'Invalid transaction PIN' }, { status: 403 });
                }
            }

            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Fetch fresh records inside session
                const sessionPayer = await User.findById(payer._id).session(session);
                const sessionRequester = await User.findById(requester._id).session(session);

                if (!sessionPayer || !sessionRequester) {
                    throw new Error('Payer or requester not found in transaction');
                }

                // Check pending withdrawals for balance verification
                const aggregated = await Transaction.aggregate([
                    { $match: { userId: user.id, type: 'WITHDRAW', currency: moneyRequest.currency, status: 'PENDING' } },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]).session(session);
                const pendingAmount = aggregated.length > 0 ? aggregated[0].total : 0;

                const balanceField = moneyRequest.currency === 'USDT' ? 'usdtBalance' : 'kesBalance';
                const availableBalance = sessionPayer[balanceField] - pendingAmount;

                if (availableBalance < moneyRequest.amount) {
                    throw new Error(`Insufficient available balance. Available KES/USDT: ${availableBalance}`);
                }

                // Deduct from payer, add to requester
                sessionPayer[balanceField] -= Number(moneyRequest.amount);
                sessionRequester[balanceField] += Number(moneyRequest.amount);

                await sessionPayer.save({ session });
                await sessionRequester.save({ session });

                // Create Transaction logs
                const payerName = sessionPayer.fullName || sessionPayer.username || sessionPayer.email;
                const requesterName = sessionRequester.fullName || sessionRequester.username || sessionRequester.email;
                const payerIdStr = sessionPayer._id.toString();
                const requesterIdStr = sessionRequester._id.toString();

                await Transaction.create([
                    {
                        userId: payerIdStr,
                        senderId: payerIdStr,
                        sender: payerName,
                        recipientId: requesterIdStr,
                        recipient: requesterName,
                        amount: Number(moneyRequest.amount),
                        currency: moneyRequest.currency,
                        type: 'TRANSFER_SEND',
                        status: 'SUCCESS',
                        createdAt: new Date()
                    },
                    {
                        userId: requesterIdStr,
                        senderId: payerIdStr,
                        sender: payerName,
                        recipientId: requesterIdStr,
                        recipient: requesterName,
                        amount: Number(moneyRequest.amount),
                        currency: moneyRequest.currency,
                        type: 'TRANSFER_RECEIVE',
                        status: 'SUCCESS',
                        createdAt: new Date()
                    }
                ], { session, ordered: true });

                // Update request status
                moneyRequest.status = 'ACCEPTED';
                moneyRequest.updatedAt = new Date();
                await moneyRequest.save({ session });

                await session.commitTransaction();

                // Check and process referral requirements
                try {
                    const { checkAndProcessReferral } = await import('@/lib/referralEngine');
                    await checkAndProcessReferral(payerIdStr);
                } catch (refErr) {
                    console.error('Referral processing error during respond request:', refErr);
                }

                // Trigger alerts (Async)
                await sendNotification(
                    requesterIdStr,
                    "Money Request Accepted",
                    `${payerName} paid your request of ${moneyRequest.amount} ${moneyRequest.currency}.`,
                    "FINANCE",
                    { push: true, inApp: true, email: true }
                );
                await sendNotification(
                    payerIdStr,
                    "Money Request Paid",
                    `Paid ${moneyRequest.amount} ${moneyRequest.currency} request from ${requesterName}.`,
                    "FINANCE",
                    { push: true, inApp: true, email: true }
                );

                return NextResponse.json({ message: 'Request accepted and paid successfully' });
            } catch (error: any) {
                if (session.inTransaction()) {
                    await session.abortTransaction();
                }
                throw error;
            } finally {
                session.endSession();
            }
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Respond Request Error:', error);
        return NextResponse.json({ message: error.message || 'Processing failed' }, { status: 500 });
    }
}
