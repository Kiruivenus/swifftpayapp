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
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();

        const user = await User.findOne({ emailNormalized });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email is already verified' }, { status: 400 });
        }

        // Delete any existing OTPs for this email to avoid clutter
        await Otp.deleteMany({
            identifier: emailNormalized,
            type: 'EMAIL_VERIFICATION'
        });

        // Generate new OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await Otp.create({
            identifier: emailNormalized,
            code,
            type: 'EMAIL_VERIFICATION',
            expiresAt
        });

        // Send Email
        await sendEmail({
            to: user.email,
            subject: 'Verify your email - SwiftPay',
            title: 'Email Verification',
            body: `To complete your registration, please use the 6-digit verification code below. This code will expire in 10 minutes.`,
            code: code,
        });

        return NextResponse.json({ ok: true, message: 'Verification code resent successfully' });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
