import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email, resetToken, newPassword } = await request.json();

        if (!email || !resetToken || !newPassword) {
            return NextResponse.json({ ok: false, message: 'Missing required fields' }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();

        // 1. Validate the reset token/OTP exists
        const otp = await Otp.findOne({
            _id: resetToken,
            identifier: emailNormalized,
            type: 'PASSWORD_RESET'
        });

        if (!otp) {
            return NextResponse.json({ ok: false, message: 'Invalid or expired reset session' }, { status: 400 });
        }

        // 2. Find and update user
        const user = await User.findOne({ emailNormalized });
        if (!user) {
            return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // 3. Cleanup: Delete all sessions/tokens (security)
        await Otp.deleteMany({ identifier: emailNormalized });

        // 4. Send notification email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Security Notice: Password Changed - SwiftPay',
                title: 'Password Updated',
                body: 'The password for your SwiftPay account was recently changed. If you did not make this change, please contact support immediately.',
            });
        } catch (err) {
            console.error('Failed to send password change notification:', err);
        }

        return NextResponse.json({
            ok: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });

    } catch (error: any) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
    }
}
