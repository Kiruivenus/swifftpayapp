import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

async function getMpesaToken() {
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    try {
        const response = await fetch(
            'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                method: 'GET',
                headers: {
                    Authorization: `Basic ${auth}`,
                },
            }
        );
        const data = await response.json();
        if (!data.access_token) {
            console.error('M-Pesa Token Response (no token):', JSON.stringify(data));
            throw new Error('No access_token in response');
        }
        return data.access_token;
    } catch (error: any) {
        console.error('M-Pesa Token Error:', error.message);
        throw new Error('Failed to get M-Pesa token. Check your credentials.');
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { amount, phoneNumber: rawPhoneNumber, userId } = await req.json();

        // 1. Normalize Phone Number to 254... format
        let phoneNumber = rawPhoneNumber.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '254' + phoneNumber.substring(1);
        } else if (phoneNumber.length === 9) {
            phoneNumber = '254' + phoneNumber;
        }

        // 2. Validate Amount (Min 1, Round to integer)
        const finalAmount = Math.max(1, Math.round(amount));

        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

        const requestBody = {
            BusinessShortCode: SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: finalAmount,
            PartyA: phoneNumber,
            PartyB: SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: CALLBACK_URL,
            AccountReference: 'SwiftPay',
            TransactionDesc: 'Deposit',
        };

        console.log('M-Pesa STK Push Outbound Request:', JSON.stringify(requestBody, null, 2));

        const stkResponse = await fetch(
            'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        const stkData = await stkResponse.json();
        console.log('M-Pesa STK Push API Response:', JSON.stringify(stkData, null, 2));

        if (stkData.ResponseCode === '0') {
            // Create a pending transaction in MongoDB
            await Transaction.create({
                userId,
                amount: finalAmount,
                currency: 'KES',
                type: 'DEPOSIT',
                method: 'MPESA',
                status: 'PENDING',
                phoneNumber,
                checkoutRequestID: stkData.CheckoutRequestID,
            });

            return NextResponse.json({
                success: true,
                message: 'STK Push sent successfully',
                CheckoutRequestID: stkData.CheckoutRequestID,
            });
        } else {
            console.error('STK Push Error Response:', stkData);
            return NextResponse.json(
                { success: false, message: stkData.CustomerMessage || stkData.ResponseDescription || 'STK Push failed' },
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
