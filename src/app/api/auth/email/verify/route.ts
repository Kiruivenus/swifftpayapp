import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import Session from '@/models/Session';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({
                ok: false,
                message: 'Please enter both your email and verification code.'
            }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();

        // 1. Verify OTP
        const validOtp = await Otp.findOne({
            identifier: emailNormalized,
            type: 'EMAIL_VERIFICATION',
            code: code.trim(),
            expiresAt: { $gt: new Date() }
        });

        if (!validOtp) {
            return NextResponse.json({
                ok: false,
                message: 'The verification code is invalid or has expired. Please request a new one.',
                code: 'INVALID_OTP'
            }, { status: 400 });
        }

        // 2. Find and update user
        const user = await User.findOne({ emailNormalized });
        if (!user) {
            return NextResponse.json({
                ok: false,
                message: 'We could not find an account with this email address.'
            }, { status: 404 });
        }

        user.emailVerified = true;
        user.status = 'ACTIVE';
        await user.save();

        // 3. Delete the used OTP
        await Otp.deleteOne({ _id: validOtp._id });

        // 4. Create session for immediate app access
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        await Session.create({
            userId: user._id,
            sessionType: 'mobile',
            status: 'active',
            deviceName: 'Registration Verification',
            platform: 'Mobile',
            lastSeenAt: new Date(),
            expiresAt
        });

        // 5. Generate JWT token for auto-login
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.fullName || user.username || 'User'
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        return NextResponse.json({
            ok: true,
            message: 'Email verified successfully! Welcome to SwiftPay.',
            token,
            role: user.role,
            username: user.username,
            isPinSet: user.isPinSet || false
        });

    } catch (error: any) {
        console.error('Email verify error:', error);
        return NextResponse.json({
            ok: false,
            message: 'Something went wrong. Please try again later.'
        }, { status: 500 });
    }
}
