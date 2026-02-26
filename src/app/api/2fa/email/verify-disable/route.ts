import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { code } = await req.json();
        if (!code) {
            return NextResponse.json({ message: 'Verification code is required' }, { status: 400 });
        }

        const otps = await Otp.find({
            identifier: user.email,
            type: '2FA_DISABLE',
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
            return NextResponse.json({ message: 'Invalid or expired code' }, { status: 400 });
        }

        await User.findByIdAndUpdate(user.id, { twoFactorEnabled: false });
        await Otp.deleteOne({ _id: validOtp._id });

        return NextResponse.json({ message: 'Two-Factor Authentication disabled successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
