import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';
import User from '@/models/User';
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

        const code = generateCode();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await Otp.create({
            identifier: user.email,
            code,
            type: '2FA_ENABLE',
            expiresAt
        });

        // MOCK EMAIL SEND
        console.log(`[2FA OTP] To: ${user.email}, Code: ${code}`);

        return NextResponse.json({ message: 'OTP sent to your email' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
