import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { checkMaintenance } from '@/lib/maintenance';
import PlatformSettings from '@/models/PlatformSettings';
import { decrypt } from '@/lib/encryption';

async function getMpesaToken(key: string, secret: string) {
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
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
        return data.access_token;
    } catch (error: any) {
        console.error('M-Pesa Token Error:', error.message);
        throw new Error('Failed to get M-Pesa token');
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();

        // Check Maintenance Mode
        const maintenance = await checkMaintenance();
        if (maintenance.isMaintenance) return maintenance.response!;

        const { amount, phoneNumber, userId } = await req.json();

        // Fetch Real Settings from DB
        const settings = await (PlatformSettings as any).getSettings();

        // Use DB settings if encrypted keys exist, otherwise fallback to environment
        const CONSUMER_KEY = settings.mpesaConsumerKey ? decrypt(settings.mpesaConsumerKey) : process.env.MPESA_CONSUMER_KEY;
        const CONSUMER_SECRET = settings.mpesaConsumerSecret ? decrypt(settings.mpesaConsumerSecret) : process.env.MPESA_CONSUMER_SECRET;
        const SHORTCODE = settings.mpesaShortCode || process.env.MPESA_SHORTCODE;
        const PASSKEY = settings.mpesaPasskey ? decrypt(settings.mpesaPasskey) : process.env.MPESA_PASSKEY;
        const CALLBACK_URL = settings.callbackBaseUrl || process.env.MPESA_CALLBACK_URL;

        const token = await getMpesaToken(CONSUMER_KEY!, CONSUMER_SECRET!);
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

        const stkResponse = await fetch(
            'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    BusinessShortCode: SHORTCODE,
                    Password: password,
                    Timestamp: timestamp,
                    TransactionType: 'CustomerBuyGoodsOnline',
                    Amount: amount,
                    PartyA: phoneNumber,
                    PartyB: 5679822,
                    PhoneNumber: phoneNumber,
                    CallBackURL: CALLBACK_URL,
                    AccountReference: 'SwiftPay Deposit',
                    TransactionDesc: 'Deposit to SwiftPay Wallet',
                }),
            }
        );

        const stkData = await stkResponse.json();

        if (stkData.ResponseCode === '0') {
            // Create a pending transaction in MongoDB
            await Transaction.create({
                userId,
                amount,
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
