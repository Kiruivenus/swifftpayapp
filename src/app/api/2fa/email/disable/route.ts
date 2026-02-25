import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { password } = await req.json();

        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Verify password to disable 2FA (security check)
        const isMatch = await bcrypt.compare(password, dbUser.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Incorrect password' }, { status: 401 });
        }

        dbUser.twoFactorEnabled = false;
        await dbUser.save();

        return NextResponse.json({ message: '2FA disabled successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
