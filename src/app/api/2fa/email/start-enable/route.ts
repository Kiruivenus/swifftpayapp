import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

import { sendEmail } from '@/lib/email';

// Helper to generate 6-digit code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await Otp.create({
            identifier: user.email,
            code,
            type: '2FA_ENABLE',
            expiresAt
        });

        // Send Real Email
        await sendEmail({
            to: user.email,
            subject: 'Security: Enable 2FA Verification - SwiftPay',
            title: 'Verify Two-Factor Authentication',
            body: 'You are enabling Two-Factor Authentication for your SwiftPay account. Please enter the verification code below to confirm this change.',
            code: code
        });

        return NextResponse.json({ message: 'OTP sent to your email' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
