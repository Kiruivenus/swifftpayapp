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
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

            // Delete old reset OTPs for this user
            await Otp.deleteMany({ identifier: user.email, type: 'PIN_RESET' });

            await Otp.create({
                identifier: user.email,
                code: resetCode,
                type: 'PIN_RESET',
                expiresAt
            });

            // MOCK EMAIL SEND
            console.log(`[PIN RESET OTP] To: ${user.email}, Code: ${resetCode}`);

            return NextResponse.json({ message: 'Reset code sent to your email' });
        }

        if (action === 'verify') {
            if (!code || !newPin || newPin.length < 4) {
                return NextResponse.json({ message: 'Missing fields or invalid PIN' }, { status: 400 });
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

            const pinHash = await bcrypt.hash(newPin, 10);
            await User.findByIdAndUpdate(user.id, { pinHash, isPinSet: true });

            // Delete the OTP after use
            await Otp.deleteOne({ _id: otpRecord._id });

            return NextResponse.json({ message: 'PIN reset successfully' });
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
