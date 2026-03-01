import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ ok: false, message: 'Please enter both your email and reset code.' }, { status: 400 });
        }

        const emailNormalized = email.trim().toLowerCase();

        const validOtp = await Otp.findOne({
            identifier: emailNormalized,
            type: 'PASSWORD_RESET',
            code: code.trim(),
            expiresAt: { $gt: new Date() }
        });

        if (!validOtp) {
            return NextResponse.json({
                ok: false,
                message: 'The reset code is invalid or has expired. Please request a new one.',
                code: 'INVALID_RESET_CODE'
            }, { status: 400 });
        }

        // 2. Return a temporary reset token (for the next step)
        // In a production app, this should be a signed JWT with short expiry (e.g., 5 mins)
        // For simplicity here, we'll use the OTP _id or similar.

        return NextResponse.json({
            ok: true,
            message: 'Code verified successfully',
            resetToken: validOtp._id // Temporary identifier
        });

    } catch (error: any) {
        console.error('Verify Reset Code Error:', error);
        return NextResponse.json({ ok: false, message: 'Something went wrong. Please try again later.' }, { status: 500 });
    }
}
