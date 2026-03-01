import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, code } = await request.json();

        if (!email || !code) {
            return NextResponse.json({ ok: false, message: 'Email and code are required' }, { status: 400 });
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
                message: 'Invalid or expired reset code',
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
        return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 });
    }
}
