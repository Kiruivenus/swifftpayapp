import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ ok: false, message: 'Email and code are required' }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();

        // 1. Verify OTP
        const otps = await Otp.find({
            identifier: emailNormalized,
            type: 'EMAIL_VERIFICATION',
            expiresAt: { $gt: new Date() }
        });

        const validOtp = await Promise.all(otps.map(async (otp) => {
            const isMatch = await bcrypt.compare(code, otp.code);
            return isMatch ? otp : null;
        })).then(results => results.find(r => r !== null));

        if (!validOtp) {
            return NextResponse.json({
                ok: false,
                message: 'Invalid or expired verification code',
                code: 'INVALID_OTP'
            }, { status: 400 });
        }

        // Find and update user
        const user = await User.findOne({ emailNormalized });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        user.emailVerified = true;
        user.status = 'ACTIVE';
        await user.save();

        // Delete the OTP
        await Otp.deleteOne({ _id: validOtp._id });

        // IMPORTANT: Create a Session so the user can actually load data (Android/Web)
        const Session = (await import('@/models/Session')).default;
        const session = await Session.create({
            userId: user._id,
            sessionType: 'web', // Defaulting to web, will be updated on next full login
            status: 'active',
            deviceName: 'Initial Verification',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
        });

        // Generate token for auto-login
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
            message: 'Email verified successfully',
            token,
            sessionId: session._id,
            role: user.role,
            username: user.username
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
