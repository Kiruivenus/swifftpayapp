import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email, resetToken, code } = await request.json();

        if (!email || !code || !resetToken) {
            return NextResponse.json({ message: 'Email, code and resetToken are required' }, { status: 400 });
        }

        // Verify OTP
        const otps = await Otp.find({
            identifier: email,
            type: 'PASSWORD_RESET',
            expiresAt: { $gt: new Date() }
        });

        const validOtp = await Promise.all(otps.map(async (otp) => {
            const isMatch = await bcrypt.compare(code, otp.code);
            return isMatch ? otp : null;
        })).then(results => results.find(r => r !== null));

        if (!validOtp) {
            return NextResponse.json({ message: 'Invalid or expired reset code' }, { status: 400 });
        }

        // In a real app we might store resetToken in DB or JWT it.
        // For now, we'll just return success and the next step will need the token again.

        return NextResponse.json({
            message: 'Code verified successfully',
            resetToken
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
