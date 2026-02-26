import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendPushNotification } from '@/lib/notifications';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email, password } = await request.json();
        const emailNormalized = email.trim().toLowerCase();

        // Find user by normalized email
        const user = await User.findOne({ emailNormalized });
        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Check Email Verification
        if (!user.emailVerified) {
            return NextResponse.json({
                status: 'EMAIL_UNVERIFIED',
                email: user.email,
                message: 'Please verify your email to continue.'
            }, { status: 403 });
        }

        // Check 2FA
        if (user.twoFactorEnabled) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await Otp.create({
                identifier: user.email,
                code,
                type: '2FA_LOGIN',
                expiresAt
            });

            const { sendEmail } = await import('@/lib/email');
            await sendEmail({
                to: user.email,
                subject: 'Security: Your Login Verification Code - SwiftPay',
                title: 'Login Verification',
                body: 'A login attempt was made for your SwiftPay account. Please use the verification code below to authorize this session.',
                code: code
            });

            return NextResponse.json({
                status: '2FA_REQUIRED',
                email: user.email,
                message: 'Two-factor authentication required'
            });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
        );

        // Trigger Notification (Async)
        sendPushNotification(
            user._id.toString(),
            "Security Alert",
            "A new login was detected on your account.",
            'security'
        );

        return NextResponse.json({
            token,
            role: user.role,
            username: user.username
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
