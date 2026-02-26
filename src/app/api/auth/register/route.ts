import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import BlockedUser from '@/models/BlockedUser';
import Otp from '@/models/Otp';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, email, phone, password } = await request.json();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        // Check if identifier is blocked (from deleted account)
        const isBlocked = await BlockedUser.findOne({
            $or: [{ email }, { phone }]
        });
        if (isBlocked) {
            return NextResponse.json({ message: 'This email or phone number cannot be used to register again.' }, { status: 403 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user (PENDING_VERIFICATION by default from schema)
        const newUser = await User.create({
            username,
            email,
            phoneNumber: phone,
            password: hashedPassword,
            role: 'USER',
            kesBalance: 0,
            usdtBalance: 0,
            status: 'PENDING_VERIFICATION',
            emailVerified: false
        });

        // Generate Verification OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await Otp.create({
            identifier: email,
            code,
            type: '2FA_LOGIN', // Reusing OTP type or we could add 'EMAIL_VERIFICATION' if needed, but the requirements just say 6-digit code
            expiresAt
        });

        // Send Email
        await sendEmail({
            to: email,
            subject: 'Verify your email - SwiftPay',
            title: 'Welcome to SwiftPay!',
            body: `Thank you for joining SwiftPay. To complete your registration and secure your account, please use the 6-digit verification code below.`,
            code: code,
        });

        return NextResponse.json({
            message: 'Registration successful. Please verify your email.',
            email: newUser.email,
            status: 'PENDING_VERIFICATION'
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
