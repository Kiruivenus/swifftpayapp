import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import MoneyRequest from '@/models/MoneyRequest';
import { verifyAuth } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

// GET received pending requests
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const receivedRequests = await MoneyRequest.find({
            payerId: user.id,
            status: 'PENDING'
        }).sort({ createdAt: -1 });

        const resolved = await Promise.all(receivedRequests.map(async (item) => {
            const requester = await User.findById(item.requesterId).select('fullName username email profilePhotoUrl kycStatus');
            return {
                id: item._id.toString(),
                amount: item.amount,
                currency: item.currency,
                reason: item.reason,
                status: item.status,
                createdAt: item.createdAt,
                requester: requester ? {
                    id: requester._id.toString(),
                    displayName: requester.fullName || requester.username || requester.email,
                    username: requester.username ? `@${requester.username.replace(/^@/, '')}` : '',
                    email: requester.email,
                    profilePhotoUrl: requester.profilePhotoUrl || null,
                    isVerified: requester.kycStatus === 'APPROVED'
                } : null
            };
        }));

        return NextResponse.json(resolved);
    } catch (error: any) {
        console.error('GET Money Requests Error:', error);
        return NextResponse.json({ message: error.message || 'Failed to load requests' }, { status: 500 });
    }
}

// POST create request
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { recipientEmail, amount, currency, reason } = await req.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
        }

        if (!recipientEmail) {
            return NextResponse.json({ message: 'Recipient email is required' }, { status: 400 });
        }

        // Find recipient (payer)
        const normalizedEmail = recipientEmail.trim().toLowerCase();
        const payer = await User.findOne({ emailNormalized: normalizedEmail });
        if (!payer) {
            return NextResponse.json({ message: 'Recipient user not found on SwiftPay' }, { status: 404 });
        }

        if (payer._id.toString() === user.id) {
            return NextResponse.json({ message: 'You cannot request money from yourself' }, { status: 400 });
        }

        const requester = await User.findById(user.id);
        if (!requester) {
            return NextResponse.json({ message: 'Requester not found' }, { status: 404 });
        }

        // Create the money request
        const moneyRequest = await MoneyRequest.create({
            requesterId: user.id,
            payerId: payer._id,
            amount: Number(amount),
            currency,
            reason: reason || '',
            status: 'PENDING'
        });

        // Trigger notifications to the payer (FCM Push notification, Email, and In-App alert)
        const requesterName = requester.fullName || requester.username || requester.email;
        const msg = `${requesterName} has requested ${amount} ${currency} from you. Reason: ${reason || 'None'}`;
        await sendNotification(
            payer._id.toString(),
            "Money Request Received",
            msg,
            "FINANCE",
            { push: true, inApp: true, email: true }
        );

        return NextResponse.json({
            message: 'Request sent successfully',
            requestId: moneyRequest._id.toString()
        });
    } catch (error: any) {
        console.error('POST Money Request Error:', error);
        return NextResponse.json({ message: error.message || 'Failed to submit request' }, { status: 500 });
    }
}
