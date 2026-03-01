import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import TrustedDevice from '@/models/TrustedDevice';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, code, deviceInfo } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ ok: false, message: 'Email and code are required' }, { status: 400 });
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
                message: 'Invalid or expired 2FA code',
                code: 'INVALID_2FA'
            }, { status: 400 });
        }

        // 2. Find user
        const user = await User.findOne({ emailNormalized });
        if (!user) {
            return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
        }

        // 3. Create TrustedDevice entry
        const trustedDevice = await TrustedDevice.create({
            userId: user._id,
            deviceId: 'web-' + Math.random().toString(36).substring(2, 11), // Simple web device ID
            deviceName: deviceInfo?.name || 'Trusted Web Browser',
            platform: deviceInfo?.platform || 'Web',
            lastUsedAt: new Date()
        });

        // 4. Delete OTP
        await Otp.deleteOne({ _id: validOtp._id });

        // 5. Create Session
        const Session = (await import('@/models/Session')).default;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

        const session = await Session.create({
            userId: user._id,
            sessionType: 'web',
            status: 'active',
            isTrusted: true,
            deviceName: deviceInfo?.name || 'Trusted Web Browser',
            platform: deviceInfo?.platform || 'Web',
            expiresAt
        });

        // 6. Generate JWT Token
        const jwt = (await import('jsonwebtoken')).default;
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

        const response = NextResponse.json({
            ok: true,
            message: 'Device authorized successfully',
            token,
            sessionId: session._id,
            role: user.role,
            username: user.username
        });

        // 7. Set Cookies
        response.cookies.set('swiftpay_td', trustedDevice._id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365 // 1 year
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 24 hours
        });

        return response;

    } catch (error: any) {
        console.error('Verify 2FA Error:', error);
        return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
    }
}
