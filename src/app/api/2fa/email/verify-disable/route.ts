import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

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

        const validOtp = await Otp.findOne({
            identifier: user.email.toLowerCase(),
            type: '2FA_DISABLE',
            code: code.trim(),
            expiresAt: { $gt: new Date() }
        });

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
