import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const checkoutRequestID = searchParams.get('checkoutRequestID');

        if (!checkoutRequestID) {
            return NextResponse.json({ message: 'CheckoutRequestID is required' }, { status: 400 });
        }

        await dbConnect();
        const transaction = await Transaction.findOne({ checkoutRequestID });

        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json({
            status: transaction.status,
            amount: transaction.amount,
            currency: transaction.currency,
            message: transaction.status === 'SUCCESS' ? 'Payment confirmed' :
                transaction.status === 'FAILED' ? 'Payment failed' : 'Payment pending'
        });

    } catch (error: any) {
        console.error('M-Pesa Status API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
