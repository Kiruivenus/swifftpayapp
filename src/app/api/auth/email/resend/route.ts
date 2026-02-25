import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (user.emailVerified) {
            return NextResponse.json({ message: 'Email is already verified' }, { status: 400 });
        }

        // Delete any existing OTPs for this email to avoid clutter
        await Otp.deleteMany({ identifier: email });

        // Generate new OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await Otp.create({
            identifier: email,
            code,
            type: '2FA_LOGIN', // Reusing OR adding new type
            expiresAt
        });

        // Send Email
        await sendEmail({
            to: email,
            subject: 'Verify your email - SwiftPay',
            body: `Your new verification code is: ${code}. It expires in 10 minutes.`
        });

        return NextResponse.json({ message: 'Verification code resent successfully' });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
