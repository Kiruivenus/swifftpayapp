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

        const otps = await Otp.find({
            identifier: emailNormalized,
            type: '2FA_LOGIN',
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        const bcrypt = await import('bcryptjs');
        let validOtp = null;
        for (const otp of otps) {
            if (await bcrypt.compare(code, otp.code)) {
                validOtp = otp;
                break;
            }
        }

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
        await Otp.deleteOne({ _id: otp._id });

        // Create final token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
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
