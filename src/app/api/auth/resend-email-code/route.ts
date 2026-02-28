import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ ok: false, message: 'Email is required' }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();

        // 1. Find user to ensure they exist
        const user = await User.findOne({ emailNormalized });
        if (!user) {
            // Security: Don't reveal if user exists, but for verification resend it's usually fine
            return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
        }

        // 2. Rate limit check: Delete old OTPs for this identifier/type to avoid spamming
        await Otp.deleteMany({
            identifier: emailNormalized,
            type: 'EMAIL_VERIFICATION'
        });

        // 3. Generate new OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await Otp.create({
            identifier: emailNormalized,
            code,
            type: 'EMAIL_VERIFICATION',
            expiresAt
        });

        // 4. Send Email
        await sendEmail({
            to: user.email,
            subject: 'Verify your email - SwiftPay',
            title: 'New Verification Code',
            body: `You requested a new verification code. Please use the 6-digit code below to verify your email address.`,
            code: code,
        });

        return NextResponse.json({
            ok: true,
            message: 'A new verification code has been sent to your email.'
        });

    } catch (error: any) {
        console.error('Resend Email Code Error:', error);
        return NextResponse.json({
            ok: false,
            message: 'Failed to resend code. Please try again later.'
        }, { status: 500 });
    }
}
