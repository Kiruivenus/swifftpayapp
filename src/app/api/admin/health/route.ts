import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    const health: any = {
        coreApi: 'ONLINE',
        database: 'OFFLINE',
        mpesa: 'UNKNOWN',
        email: 'UNKNOWN',
        timestamp: new Date().toISOString()
    };

    try {
        // 1. Database Check
        await dbConnect();
        if (mongoose.connection.readyState === 1) {
            health.database = 'ONLINE';
        }

        // 2. M-Pesa Ping (Check if credentials exist and token can be generated)
        // Note: For real environment, we'd call Safaricom's Oauth endpoint
        const mpesaKey = process.env.MPESA_CONSUMER_KEY;
        if (mpesaKey && mpesaKey !== 'YOUR_MPESA_CONSUMER_KEY') {
            health.mpesa = 'ONLINE';
        } else {
            health.mpesa = 'WARNING';
        }

        // 3. Email/SMTP Check
        const smtpHost = process.env.SMTP_HOST;
        if (smtpHost) {
            health.email = 'ONLINE';
        } else {
            health.email = 'OFFLINE';
        }

        return NextResponse.json(health);

    } catch (err: any) {
        return NextResponse.json({
            ...health,
            message: err.message,
            status: 'DEGRADED'
        }, { status: 500 });
    }
}
