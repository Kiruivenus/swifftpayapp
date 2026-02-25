import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendPushNotification } from '@/lib/notifications';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email, password } = await request.json();

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // Check 2FA
        if (user.twoFactorEnabled) {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await Otp.create({
                identifier: user.email,
                code,
                type: '2FA_LOGIN',
                expiresAt
            });

            // MOCK EMAIL SEND
            console.log(`[2FA LOGIN OTP] To: ${user.email}, Code: ${code}`);

            return NextResponse.json({
                status: '2FA_REQUIRED',
                email: user.email,
                message: 'Two-factor authentication required'
            });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        { expiresIn: '1d' }
        );

        // Trigger Notification (Async)
        sendPushNotification(
            user._id.toString(),
            "Security Alert",
            "A new login was detected on your account.",
            'security'
        );

        return NextResponse.json({
            token,
            role: user.role,
            username: user.username
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
