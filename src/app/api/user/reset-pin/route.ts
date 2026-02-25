import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Otp from '@/models/Otp';
import { verifyAuth } from '@/lib/auth';

// Helper to generate 6-digit code
function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, code, newPin } = body;

        if (action === 'start') {
            const dbUser = await User.findById(user.id);
            if (!dbUser) {
                return NextResponse.json({ message: 'User not found' }, { status: 404 });
            }

            const resetCode = generateCode();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            await Otp.deleteMany({ identifier: user.email, type: 'PIN_RESET' });
            await Otp.create({
                identifier: user.email,
                code: resetCode,
                type: 'PIN_RESET',
                expiresAt
            });

            const { sendEmail } = await import('@/lib/email');
            await sendEmail({
                to: user.email,
                subject: 'Your PIN Reset Code',
                body: `Use this code to reset your transaction PIN: ${resetCode}. It expires in 10 minutes.`
            });

            return NextResponse.json({ message: 'Reset code sent' });
        }

        if (action === 'verify') {
            if (!code) {
                return NextResponse.json({ message: 'Verification code required' }, { status: 400 });
            }

            const otpRecord = await Otp.findOne({
                identifier: user.email,
                code,
                type: 'PIN_RESET',
                expiresAt: { $gt: new Date() }
            });

            if (!otpRecord) {
                return NextResponse.json({ message: 'Invalid or expired code' }, { status: 401 });
            }

            // OTP is valid. Return success. The client will then call 'complete' with the same code as a token.
            return NextResponse.json({ message: 'Code verified', success: true });
        }

        if (action === 'complete') {
            if (!code || !newPin || newPin.length < 4) {
                return NextResponse.json({ message: 'Missing fields or invalid PIN' }, { status: 400 });
            }

            // Verify the code still exists and hasn't expired (acts as the reset token)
            const otpRecord = await Otp.findOne({
                identifier: user.email,
                code,
                type: 'PIN_RESET',
                expiresAt: { $gt: new Date() }
            });

            if (!otpRecord) {
                return NextResponse.json({ message: 'Session expired. Please restart reset flow.' }, { status: 401 });
            }

            const pinHash = await bcrypt.hash(newPin, 10);
            await User.findByIdAndUpdate(user.id, { pinHash, isPinSet: true });

            await Otp.deleteMany({ identifier: user.email, type: 'PIN_RESET' });

            return NextResponse.json({ message: 'PIN reset successfully' });
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
