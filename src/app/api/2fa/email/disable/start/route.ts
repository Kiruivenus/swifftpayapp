import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendEmail } from '@/lib/email';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Check if 2FA is actually enabled
        const dbUser = await User.findById(user.id);
        if (!dbUser?.twoFactorEnabled) {
            return NextResponse.json({ message: '2FA is not enabled' }, { status: 400 });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Delete existing 2FA_DISABLE OTPs for this email
        await Otp.deleteMany({ identifier: user.email, type: '2FA_DISABLE' });

        await Otp.create({
            identifier: user.email,
            code,
            type: '2FA_DISABLE',
            expiresAt
        });

        // Send Email
        await sendEmail({
            to: user.email,
            subject: 'Security: Disable 2FA - SwiftPay',
            title: 'Disable Two-Factor Authentication',
            body: `You are requesting to disable Two-Factor Authentication for your SwiftPay account. Please use the verification code below to authorize this action.`,
            code: code
        });

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email'
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
