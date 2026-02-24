import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const body = await req.json();
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
                { new: true }
            );

            if (transaction) {
                // Update User Balance
                await User.findByIdAndUpdate(transaction.userId, {
                    $inc: { balance: amount }
                });
            }

            console.log(`Deposit successful for ${checkoutRequestID}`);
        } else {
            // Failed
            await Transaction.findOneAndUpdate(
                { checkoutRequestID },
                { status: 'FAILED' }
            );
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
