import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const otp = await Otp.findOne({
            identifier: email,
            code,
            type: '2FA_LOGIN',
            expiresAt: { $gt: new Date() }
        });

        if (!otp) {
            return NextResponse.json({ message: 'Invalid or expired code' }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Clean up OTP
        await Otp.deleteOne({ _id: otp._id });

        // Create final token
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
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
