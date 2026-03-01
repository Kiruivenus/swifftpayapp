import { NextResponse, NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import TrustedDevice from '@/models/TrustedDevice';
import Session from '@/models/Session';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, code, deviceInfo } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ ok: false, message: 'Please enter both your email and verification code.' }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();

        // 1. Verify OTP (direct string match - codes are stored plain)
        const validOtp = await Otp.findOne({
            identifier: emailNormalized,
            type: '2FA_LOGIN',
            code: code.trim(),
            expiresAt: { $gt: new Date() }
        });

        if (!validOtp) {
            return NextResponse.json({
                ok: false,
                message: 'The verification code is invalid or has expired. Please request a new one.',
                code: 'INVALID_2FA'
            }, { status: 400 });
        }

        // 2. Find user
        const user = await User.findOne({ emailNormalized });
        if (!user) {
            return NextResponse.json({ ok: false, message: 'We could not find an account with this email address.' }, { status: 404 });
        }

        // 3. Delete OTP (consume it)
        await Otp.deleteOne({ _id: validOtp._id });

        // 4. Create or update TrustedDevice entry
        const deviceId = 'web-' + Math.random().toString(36).substring(2, 11);
        await TrustedDevice.create({
            userId: user._id,
            deviceId,
            deviceName: deviceInfo?.name || 'Trusted Web Browser',
            platform: deviceInfo?.platform || 'Web',
            lastUsedAt: new Date()
        });

        // 5. Generate JWT Token
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                role: user.role,
                name: user.fullName || user.username || 'User'
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        // 6. Create Session (with required refreshTokenHash)
        await Session.create({
            userId: user._id,
            sessionType: 'web',
            status: 'active',
            refreshTokenHash: 'N/A', // Not using refresh tokens
            isTrusted: true,
            deviceId,
            deviceName: deviceInfo?.name || 'Trusted Web Browser',
            platform: deviceInfo?.platform || 'Web',
            expiresAt
        });

        const response = NextResponse.json({
            ok: true,
            message: 'Login successful',
            token,
            role: user.role,
            username: user.username
        });

        // 7. Set auth cookies
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        response.cookies.set('swiftpay_td', deviceId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365 // 1 year
        });

        return response;

    } catch (error: any) {
        console.error('Verify 2FA Error:', error);
        return NextResponse.json({ ok: false, message: 'Something went wrong. Please try again later.' }, { status: 500 });
    }
}
