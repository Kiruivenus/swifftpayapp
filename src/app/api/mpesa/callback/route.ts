import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
        console.log('M-Pesa Callback Full Body:', JSON.stringify(body, null, 2));
        const result = body.Body.stkCallback;

        const checkoutRequestID = result.CheckoutRequestID;
        const resultCode = result.ResultCode;

        if (resultCode === 0) {
            // Success
            const callbackMetadata = result.CallbackMetadata.Item;
            const amount = callbackMetadata.find((item: any) => item.Name === 'Amount').Value;
            const mpesaReceiptNumber = callbackMetadata.find((item: any) => item.Name === 'MpesaReceiptNumber').Value;
            const phoneNumber = callbackMetadata.find((item: any) => item.Name === 'PhoneNumber').Value;

            // Update Transaction
            const transaction = await Transaction.findOneAndUpdate(
                { checkoutRequestID },
                {
                    status: 'SUCCESS',
                    mpesaReceiptNumber,
                    amount // Ensure amount matches
                },
                { returnDocument: 'after' }
            );

            if (transaction) {
                // Update User Balance - specific to kesBalance
                await User.findByIdAndUpdate(transaction.userId, {
                    $inc: { kesBalance: amount }
                });

                // Trigger Success Notification
                try {
                    const { sendNotification } = await import('@/lib/notifications');
                    await sendNotification(
                        transaction.userId,
                        "Deposit Successful",
                        `Your deposit of ${amount} KES via M-Pesa was successful. Receipt: ${mpesaReceiptNumber}`,
                        'FINANCE'
                    );
                } catch (notifyErr) {
                    console.error('Deposit Success Notification Error:', notifyErr);
                }
            }

            console.log(`Deposit successful for ${checkoutRequestID}`);
        } else {
            // Failed
            const failedTx = await Transaction.findOneAndUpdate(
                { checkoutRequestID },
                { status: 'FAILED' },
                { returnDocument: 'after' }
            );

            if (failedTx) {
                // Trigger Failure Notification
                try {
                    const { sendNotification } = await import('@/lib/notifications');
                    await sendNotification(
                        failedTx.userId,
                        "Deposit Failed",
                        `Your deposit of ${failedTx.amount} KES was unsuccessful. Reason: ${result.ResultDesc}`,
                        'FINANCE'
                    );
                } catch (notifyErr) {
                    console.error('Deposit Failure Notification Error:', notifyErr);
                }
            }
            console.log(`Deposit failed for ${checkoutRequestID}: ${result.ResultDesc}`);
        }

        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (error: any) {
        console.error('M-Pesa Callback Error:', error);
        return NextResponse.json(
            { ResultCode: 1, ResultDesc: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
