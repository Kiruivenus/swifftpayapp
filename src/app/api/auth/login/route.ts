import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import Session from '@/models/Session';
import SecurityPolicy from '@/models/SecurityPolicy';
import SecurityEvent from '@/models/SecurityEvent';
import TrustedDevice from '@/models/TrustedDevice';
import { sendPushNotification } from '@/lib/notifications';
import { lookupIp } from '@/lib/geo';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email, password, deviceId, deviceInfo, sessionType = 'mobile' } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        // 1. Fetch Global Policy
        const policy = await (SecurityPolicy as any).getSettings();

        // 2. Find user
        const user = await User.findOne({ emailNormalized });
        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // 3. IP Geo Check (New Policy)
        const geo = await lookupIp(ip);
        if (policy.blockNonKenyanIps && geo && !policy.allowedCountries.includes(geo.countryCode)) {
            await SecurityEvent.create({
                type: 'SUSPICIOUS_LOGIN',
                severity: 'high',
                userId: user._id,
                ip,
                message: `Login blocked: Unauthorized region ${geo.country} (${geo.countryCode})`,
                metadata: { geo }
            });
            return NextResponse.json({
                message: 'Access denied from your current region.'
            }, { status: 403 });
        }

        // 4. Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Track failed logic for future lockout policy if needed
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // 5. Check Email Verification
        if (!user.emailVerified) {
            return NextResponse.json({
                status: 'EMAIL_UNVERIFIED',
                email: user.email,
                message: 'Please verify your email to continue.'
            }, { status: 403 });
        }

        // 6. Check Device Trust
        let isTrusted = false;
        if (deviceId) {
            const trustedDevice = await TrustedDevice.findOne({
                userId: user._id,
                deviceId: deviceId,
                revokedAt: null
            });
            if (trustedDevice) {
                isTrusted = true;
                trustedDevice.lastUsedAt = new Date();
                await trustedDevice.save();
            }
        }

        // SECURITY: If not a trusted device, disable transaction biometrics
        if (!isTrusted && user.biometricEnabled) {
            user.biometricEnabled = false;
            await user.save();
        }

        // 7. Check 2FA
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
                    message: 'Two-factor authentication required'
                });
            }
        }

        // 8. Create Session
        const sessionMaxAge = policy.sessionMaxAgeHours || 24;
        const expiresAt = new Date(Date.now() + sessionMaxAge * 60 * 60 * 1000);

        // JWT Token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.fullName || user.username || 'User' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: `${sessionMaxAge}h` }
        );

        let session;
        const sessionData = {
            refreshTokenHash: 'N/A', // Update later if implementing RT rotation
            sessionType: sessionType || (deviceId ? 'mobile' : 'web'),
            status: 'active',
            deviceName: deviceInfo?.name || 'Unknown Device',
            platform: deviceInfo?.platform || 'Web',
            browser: deviceInfo?.browser,
            appVersion: deviceInfo?.appVersion,
            ip,
            geo,
            isTrusted,
            lastSeenAt: new Date(),
            expiresAt
        };

        if (deviceId) {
            session = await Session.findOneAndUpdate(
                { userId: user._id, deviceId },
                { ...sessionData, status: 'active' },
                { upsert: true, new: true }
            );
        } else {
            session = await Session.create({
                userId: user._id,
                ...sessionData
            });
        }

        // Trigger Notification (Async)
        sendPushNotification(
            user._id.toString(),
            "Security Alert",
            "A new login was detected on your account.",
            'security'
        );

        const response = NextResponse.json({
            token,
            sessionId: session._id,
            role: user.role.toLowerCase(),
            username: user.username
        });

        // Set cookie for web authentication
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * sessionMaxAge
        });

        return response;

    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
