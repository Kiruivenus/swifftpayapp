import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import axios from 'axios';

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

async function getMpesaToken() {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    try {
        const response = await axios.get(
            'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('M-Pesa Token Error:', error);
        throw new Error('Failed to get M-Pesa token');
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { amount, phoneNumber, userId } = await req.json();

        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

        const stkResponse = await axios.post(
            'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                BusinessShortCode: SHORTCODE,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: phoneNumber,
                PartyB: SHORTCODE,
                PhoneNumber: phoneNumber,
                CallBackURL: CALLBACK_URL,
                AccountReference: 'SwiftPay Deposit',
                TransactionDesc: 'Deposit to SwiftPay Wallet',
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (stkResponse.data.ResponseCode === '0') {
            // Create a pending transaction in MongoDB
            await Transaction.create({
                userId,
                amount,
                currency: 'KES',
                type: 'DEPOSIT',
                method: 'MPESA',
                status: 'PENDING',
                phoneNumber,
                checkoutRequestID: stkResponse.data.CheckoutRequestID,
            });

            return NextResponse.json({
                success: true,
                message: 'STK Push sent successfully',
                CheckoutRequestID: stkResponse.data.CheckoutRequestID,
            });
        } else {
            return NextResponse.json(
                { success: false, message: 'STK Push failed' },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('STK Push API Error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
