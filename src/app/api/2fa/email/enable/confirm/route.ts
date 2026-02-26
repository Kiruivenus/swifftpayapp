import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { code } = await req.json();
        if (!code) {
            return NextResponse.json({ message: 'Verification code is required' }, { status: 400 });
        }

        await dbConnect();

        // Find the most recent OTP for this user
        const otps = await Otp.find({
            identifier: user.email,
            type: '2FA_ENABLE',
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        let validOtp = null;
        for (const otp of otps) {
            const isMatch = await bcrypt.compare(code, otp.code);
            if (isMatch) {
                validOtp = otp;
                break;
            }
        }

        if (!validOtp) {
            return NextResponse.json({ message: 'Invalid or expired verification code' }, { status: 400 });
        }

        // Enable 2FA for user
        await User.findByIdAndUpdate(user.id, { twoFactorEnabled: true });

        // Delete used OTP
        await Otp.deleteOne({ _id: validOtp._id });

        return NextResponse.json({
            success: true,
            message: 'Two-Factor Authentication enabled successfully'
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
