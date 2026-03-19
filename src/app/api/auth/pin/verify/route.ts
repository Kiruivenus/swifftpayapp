import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import TrustedDevice from '@/models/TrustedDevice';
import SecurityPolicy from '@/models/SecurityPolicy';
import Session from '@/models/Session';

// Rough in-memory rate limiting for demo/simplicity. 
// In production, use Redis or a DB-backed tracker.
const failedAttempts = new Map<string, { count: number, lastAttempt: number }>();

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { pin, deviceId, email } = await req.json();

        if (!pin || !deviceId || !email) {
            return NextResponse.json({ message: 'PIN, email, and deviceId are required.' }, { status: 400 });
        }

        const trackerKey = `${deviceId}_${email}`;
        const tracker = failedAttempts.get(trackerKey);

        if (tracker && tracker.count >= 5) {
            const timeLeft = Math.ceil((tracker.lastAttempt + 30000 - Date.now()) / 1000);
            if (timeLeft > 0) {
                return NextResponse.json({
                    message: `Too many attempts. Please wait ${timeLeft} seconds.`,
                    lockoutSeconds: timeLeft
                }, { status: 429 });
            } else {
                failedAttempts.delete(trackerKey);
            }
        }

        const emailNormalized = email.trim().toLowerCase();
        
        // Find user first
        const user = await User.findOne({ emailNormalized });
        if (!user || !user.pinHash) {
            return NextResponse.json({ message: 'User not found or PIN not set.' }, { status: 404 });
        }

        // Find device for this specific user
        const trustedDevice = await TrustedDevice.findOne({ userId: user._id, deviceId, revokedAt: null });
        if (!trustedDevice) {
            return NextResponse.json({ message: 'Device not recognized or access revoked. Please log in with your password.' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(pin, user.pinHash);

        if (!isMatch) {
            const newCount = (tracker?.count || 0) + 1;
            failedAttempts.set(trackerKey, { count: newCount, lastAttempt: Date.now() });
            return NextResponse.json({ message: 'Incorrect PIN. Try again.' }, { status: 401 });
        }

        // Clear attempts on success
        failedAttempts.delete(trackerKey);

        // Generate Session Token
        const policy = await (SecurityPolicy as any).getSettings();
        const sessionMaxAge = policy.sessionMaxAgeHours || 24;

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role, name: user.fullName || user.username },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: `${sessionMaxAge}h` }
        );

        // Update session
        await Session.findOneAndUpdate(
            { userId: user._id, deviceId },
            { lastSeenAt: new Date(), status: 'active' },
            { upsert: true }
        );

        trustedDevice.lastUsedAt = new Date();
        await trustedDevice.save();

        return NextResponse.json({
            token,
            role: user.role.toLowerCase(),
            username: user.username
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
