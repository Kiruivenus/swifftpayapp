import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ message: 'Email and code are required' }, { status: 400 });
        }

        // Find all OTPs for this identifier
        const otps = await Otp.find({
            identifier: email,
            expiresAt: { $gt: new Date() }
        });

        const validOtp = await Promise.all(otps.map(async (otp) => {
            const isMatch = await bcrypt.compare(code, otp.code);
            return isMatch ? otp : null;
        })).then(results => results.find(r => r !== null));

        if (!validOtp) {
            return NextResponse.json({ message: 'Invalid or expired verification code' }, { status: 400 });
        }

        // Find and update user
        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        user.emailVerified = true;
        user.status = 'ACTIVE';
        await user.save();

        // Delete the OTP
        await Otp.deleteOne({ _id: otp._id });

        // Generate token for auto-login
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        return NextResponse.json({
            message: 'Email verified successfully',
            token,
            role: user.role,
            username: user.username
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
