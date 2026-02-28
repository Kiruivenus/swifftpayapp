import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import Session from '@/models/Session';
import TrustedDevice from '@/models/TrustedDevice';
import { sendPushNotification } from '@/lib/notifications';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email, password, deviceId, deviceInfo } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
        }

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

        // Check Device Trust and handle biometric security
        let isTrusted = false;
        if (deviceId) {
            const trustedDevice = await TrustedDevice.findOne({
                userId: user._id,
                deviceId: deviceId,
                revokedAt: null
            });
            if (trustedDevice) {
                isTrusted = true;
                // Update last used
                trustedDevice.lastUsedAt = new Date();
                await trustedDevice.save();
            }
        }

        // SECURITY: If not a trusted device, disable transaction biometrics
        // User must re-enable them on the new device
        if (!isTrusted && user.biometricEnabled) {
            user.biometricEnabled = false;
            await user.save();
        }

        // Check 2FA
        if (user.twoFactorEnabled) {
            if (!isTrusted) {
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

                await Otp.create({
                    identifier: emailNormalized,
                    code,
                    type: '2FA_LOGIN',
                    expiresAt
                });

                const { sendEmail } = await import('@/lib/email');
                await sendEmail({
                    to: user.email,
                    subject: 'Security: Your Login Verification Code - SwiftPay',
                    title: 'Login Verification',
                    body: 'A login attempt was made from a new device. Please use the verification code below to authorize this session.',
                    code: code
                });

                return NextResponse.json({
                    status: '2FA_REQUIRED',
                    email: user.email,
                    message: 'Two-factor authentication required for this device'
                });
            }
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        // Create or update session
        const ipAddress = request.headers.get('x-forwarded-for') || 'Unknown';

        let session;
        if (deviceId) {
            session = await Session.findOneAndUpdate(
                { userId: user._id, deviceId },
                {
                    token,
                    deviceName: deviceInfo?.name || 'Unknown Device',
                    platform: deviceInfo?.platform || 'Android',
                    osVersion: deviceInfo?.osVersion,
                    appVersion: deviceInfo?.appVersion,
                    ipAddress,
                    isActive: true,
                    revokedAt: null,
                    lastActive: new Date()
                },
                { upsert: true, new: true }
            );
        } else {
            session = await Session.create({
                userId: user._id,
                token,
                deviceName: deviceInfo?.name || 'Unknown Device',
                platform: deviceInfo?.platform || 'Android',
                osVersion: deviceInfo?.osVersion,
                appVersion: deviceInfo?.appVersion,
                ipAddress,
                isActive: true,
                lastActive: new Date()
            });
        }

        // Trigger Notification (Async)
        sendPushNotification(
            user._id.toString(),
            "Security Alert",
            "A new login was detected on your account.",
            'security'
        );

        return NextResponse.json({
            token,
            sessionId: session._id,
            role: user.role.toLowerCase(),
            username: user.username
        });

    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
