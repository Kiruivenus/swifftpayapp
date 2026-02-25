import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Otp from '@/models/Otp';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { code } = await req.json();

        const otp = await Otp.findOne({
            identifier: user.email,
            code,
            type: '2FA_ENABLE',
            expiresAt: { $gt: new Date() }
        });

        if (!otp) {
            return NextResponse.json({ message: 'Invalid or expired code' }, { status: 400 });
        }

        await User.findByIdAndUpdate(user.id, { twoFactorEnabled: true });
        await Otp.deleteOne({ _id: otp._id });

        return NextResponse.json({ message: '2FA enabled successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
