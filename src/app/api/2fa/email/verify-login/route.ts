import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';
import User from '@/models/User';
import Session from '@/models/Session';
import TrustedDevice from '@/models/TrustedDevice';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { email, code, deviceId, deviceInfo } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();

        const validOtp = await Otp.findOne({
            identifier: emailNormalized,
            type: '2FA_LOGIN',
            code: code.trim(),
            expiresAt: { $gt: new Date() }
        });

        if (!validOtp) {
            return NextResponse.json({ message: 'Invalid or expired code' }, { status: 400 });
        }

        const user = await User.findOne({ emailNormalized });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Add to trusted devices if deviceId is provided
        if (deviceId) {
            await TrustedDevice.findOneAndUpdate(
                { userId: user._id, deviceId },
                {
                    userId: user._id,
                    deviceId,
                    deviceName: deviceInfo?.name || 'Unknown Device',
                    platform: deviceInfo?.platform || 'Unknown',
                    lastUsedAt: new Date(),
                    revokedAt: null
                },
                { upsert: true, new: true }
            );
        }

        // Clean up OTP
        await Otp.deleteOne({ _id: validOtp._id });

        // Create final token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.fullName || user.username || 'User' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        // Create or update session
        const ipAddress = req.headers.get('x-forwarded-for') || 'Unknown';

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
                    ip: ipAddress,
                    status: 'active',
                    revokedAt: null,
                    lastSeenAt: new Date()
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
                ip: ipAddress,
                status: 'active',
                lastSeenAt: new Date()
            });
        }

        return NextResponse.json({
            token,
            sessionId: session._id,
            role: user.role,
            username: user.username
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
