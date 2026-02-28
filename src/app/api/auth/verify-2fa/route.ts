import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import TrustedDevice from '@/models/TrustedDevice';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, code, deviceInfo } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ ok: false, message: 'Email and code are required' }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();

        // 1. Verify OTP
        const otps = await Otp.find({
            identifier: emailNormalized,
            type: '2FA_LOGIN',
            expiresAt: { $gt: new Date() }
        });

        const validOtp = await Promise.all(otps.map(async (otp) => {
            const isMatch = await bcrypt.compare(code, otp.code);
            return isMatch ? otp : null;
        })).then(results => results.find(r => r !== null));

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

        const response = NextResponse.json({
            ok: true,
            message: 'Device authorized successfully'
        });

        // 5. Set the TD cookie (long-lived)
        response.cookies.set('swiftpay_td', trustedDevice._id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365 // 1 year
        });

        return response;

    } catch (error: any) {
        console.error('Verify 2FA Error:', error);
        return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
    }
}
