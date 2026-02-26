import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await User.findOne({ email });

        // Requirement: Do NOT reveal if user exists for security OR follow user prompt to show error.
        // User prompt says: "If user does NOT exist: show error 'No account found with this email.'"
        if (!user) {
            return NextResponse.json({ message: 'No account found with this email.' }, { status: 404 });
        }

        // Generate code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Generate a reset token (sessionId) to link request and verify
        const resetToken = crypto.randomBytes(32).toString('hex');

        await Otp.create({
            identifier: email,
            code,
            type: 'PASSWORD_RESET',
            expiresAt
        });

        // Send Email
        await sendEmail({
            to: email,
            subject: 'Password Reset Code - SwiftPay',
            title: 'Reset Your Password',
            body: `We received a request to reset your password. Use the 6-digit code below to proceed with the reset. If you didn't request this, you can safely ignore this email.`,
            code: code,
        });

        return NextResponse.json({
            message: 'Reset code sent successfully',
            resetToken // This will be passed to verify step
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
