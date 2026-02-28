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

        // 1. Find user
        const user = await User.findOne({ emailNormalized });
        if (!user) {
            // Security: Don't reveal if user exists
            return NextResponse.json({
                ok: true,
                message: 'If an account exists with this email, you will receive a reset code shortly.'
            });
        }

        // 2. Clear old reset OTPs
        await Otp.deleteMany({
            identifier: emailNormalized,
            type: 'PASSWORD_RESET'
        });

        // 3. Generate reset code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await Otp.create({
            identifier: emailNormalized,
            code,
            type: 'PASSWORD_RESET',
            expiresAt
        });

        // 4. Send Email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Reset your password - SwiftPay',
                title: 'Password Reset Request',
                body: 'We received a request to reset your SwiftPay password. Use the code below to proceed with the reset. If you did not request this, please ignore this email.',
                code: code
            });
        } catch (err) {
            console.error('Failed to send reset email:', err);
        }

        return NextResponse.json({
            ok: true,
            message: 'If an account exists with this email, you will receive a reset code shortly.'
        });

    } catch (error: any) {
        console.error('Forgot Password API Error:', error);
        return NextResponse.json({ ok: false, message: 'Internal server error' }, { status: 500 });
    }
}
