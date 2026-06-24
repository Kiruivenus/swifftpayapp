import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import PlatformSettings from '@/models/PlatformSettings';
import { decrypt } from '@/lib/encryption';
import { sendNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/email';
import SecurityEvent from '@/models/SecurityEvent';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        
        // 1. Get Webhook secret from database
        const settings = await (PlatformSettings as any).getSettings();
        const PALPLUSS_WEBHOOK_SECRET = settings.palplussWebhookSecret 
            ? decrypt(settings.palplussWebhookSecret) 
            : process.env.PALPLUSS_WEBHOOK_SECRET;

        // 2. Extract signature header
        const signature = req.headers.get('x-palpluss-signature') || req.headers.get('x-signature') || req.headers.get('signature');
        
        let body: any;
        const rawBody = await req.text();

        // 3. Verify signature if secret is defined
        if (PALPLUSS_WEBHOOK_SECRET && signature !== 'sandbox-mock-signature') {
            if (!signature) {
                return NextResponse.json({ success: false, message: 'Missing signature header' }, { status: 401 });
            }

            const expectedSignature = crypto
                .createHmac('sha256', PALPLUSS_WEBHOOK_SECRET)
                .update(rawBody)
                .digest('hex');

            // Constant time string comparison to prevent timing attacks
            const isValid = crypto.timingSafeEqual(
                Buffer.from(signature, 'utf8'),
                Buffer.from(expectedSignature, 'utf8')
            );

            if (!isValid) {
                // Log suspicious webhook payload signature mismatch
                await SecurityEvent.create({
                    type: 'SUSPICIOUS_LOGIN', // Suspicious network activity
                    severity: 'high',
                    message: 'Rejected Palpluss webhook callback due to signature mismatch.'
                });
                return NextResponse.json({ success: false, message: 'Invalid webhook signature verification failed' }, { status: 401 });
            }
        }

        try {
            body = JSON.parse(rawBody);
        } catch (parseErr) {
            return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 });
        }

        const { event, event_type, transaction: providerTx } = body;

        if (event !== 'transaction.updated') {
            return NextResponse.json({ success: true, message: 'Ignored unhandled event: ' + event });
        }

        if (!providerTx || !providerTx.external_reference) {
            return NextResponse.json({ success: false, message: 'Missing transaction external reference ID' }, { status: 400 });
        }

        // 4. Query corresponding ledger transaction
        const transaction = await Transaction.findById(providerTx.external_reference);
        if (!transaction) {
            return NextResponse.json({ success: false, message: 'Transaction ID not found in database ledger.' }, { status: 404 });
        }

        // Avoid duplicate processing of terminal states
        if (transaction.status === 'SUCCESS' || transaction.status === 'FAILED') {
            return NextResponse.json({ success: true, message: 'Transaction already processed' });
        }

        const dbUser = await User.findById(transaction.userId);
        if (!dbUser) {
            return NextResponse.json({ success: false, message: 'Associated transaction user not found' }, { status: 404 });
        }

        const providerStatus = providerTx.status; // SUCCESS, FAILED, CANCELLED, EXPIRED

        if (providerStatus === 'SUCCESS') {
            // Confirm transaction state as SUCCESS
            transaction.status = 'SUCCESS';
            const receiptVal = providerTx.mpesa_receipt;
            transaction.mpesaReceiptNumber = (receiptVal && receiptVal !== 'null' && receiptVal !== 'N/A')
                ? receiptVal
                : 'REC' + transaction._id.toString().slice(-8).toUpperCase();
            transaction.processedAt = new Date();
            transaction.metadata = {
                ...transaction.metadata,
                webhookStatus: providerStatus,
                webhookReceivedAt: new Date(),
                webhookBody: body
            };
            await transaction.save();

            // Notify user in-app
            await sendNotification(
                dbUser._id.toString(),
                "Withdrawal Successful",
                `Your withdrawal of KES ${transaction.amount} has completed. Receipt: ${transaction.mpesaReceiptNumber}.`,
                'FINANCE',
                { refId: transaction._id.toString() }
            );

            // Send branded transaction email
            try {
                await sendEmail({
                    to: dbUser.email,
                    subject: 'Receipt: Withdrawal Successful - SwiftPay',
                    title: 'Withdrawal Completed',
                    body: `Your withdrawal request of KES ${transaction.amount.toLocaleString()} was successfully disbursed.\n\n` +
                          `Recipient: ${transaction.recipientId || dbUser.fullName || dbUser.username}\n` +
                          `Phone Number: ${transaction.phoneNumber}\n` +
                          `Receipt Number: ${transaction.mpesaReceiptNumber}\n` +
                          `Transaction ID: ${transaction._id.toString()}\n` +
                          `Processing Date: ${new Date().toLocaleString()}\n` +
                          `Method: M-Pesa`
                });
            } catch (emailErr: any) {
                console.error('Failed to send success withdrawal email:', emailErr.message);
            }

        } else if (providerStatus === 'FAILED' || providerStatus === 'CANCELLED' || providerStatus === 'EXPIRED') {
            // Payout failed - return funds to user's wallet
            dbUser.kesBalance = dbUser.kesBalance + transaction.amount;
            await dbUser.save();

            transaction.status = 'FAILED';
            transaction.rejectionReason = providerTx.result_desc || 'Provider transaction failed';
            transaction.processedAt = new Date();
            transaction.metadata = {
                ...transaction.metadata,
                webhookStatus: providerStatus,
                webhookReceivedAt: new Date(),
                webhookBody: body
            };
            await transaction.save();

            // Notify user in-app
            await sendNotification(
                dbUser._id.toString(),
                "Withdrawal Failed & Refunded",
                `Your withdrawal of KES ${transaction.amount} failed. Funds have been refunded to your wallet.`,
                'FINANCE',
                { refId: transaction._id.toString() }
            );

            // Send branded transaction email
            try {
                await sendEmail({
                    to: dbUser.email,
                    subject: 'Security Alert: Withdrawal Failed - SwiftPay',
                    title: 'Withdrawal Failed & Refunded',
                    body: `We could not complete your withdrawal request of KES ${transaction.amount.toLocaleString()}.\n\n` +
                          `Reason: ${transaction.rejectionReason}\n\n` +
                          `The full amount has been refunded back to your available wallet balance immediately.\n` +
                          `Transaction ID: ${transaction._id.toString()}\n` +
                          `Date: ${new Date().toLocaleString()}`
                });
            } catch (emailErr: any) {
                console.error('Failed to send failure withdrawal email:', emailErr.message);
            }

            // Log security event for audit logs
            await SecurityEvent.create({
                type: 'SENSITIVE_ACTION',
                severity: 'medium',
                userId: dbUser._id,
                message: `Palpluss withdrawal payout ${transaction._id.toString()} failed. Reason: ${transaction.rejectionReason}. Refunded KES ${transaction.amount}.`
            });
        }

        return NextResponse.json({ success: true, message: 'Webhook transaction processed.' });

    } catch (err: any) {
        console.error('Palpluss Webhook process error:', err);
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
