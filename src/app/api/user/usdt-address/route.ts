import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        let dbUser = await User.findById(user.id);

        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        if (!dbUser.usdtAddress) {
            // Generate a mock TRC20 address if none exists
            const mockAddress = 'T' + Array.from({ length: 33 }, () => Math.random().toString(36).charAt(2)).join('');
            dbUser.usdtAddress = mockAddress;
            await dbUser.save();
        }

        return NextResponse.json({ address: dbUser.usdtAddress });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
