import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const userPayload = await verifyAuth(req);
        if (!userPayload) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { password, newPin } = await req.json();

        if (!password || !newPin || newPin.length < 4) {
            return NextResponse.json({ message: 'Password and a new 4-digit PIN are required.' }, { status: 400 });
        }

        const user = await User.findById(userPayload.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Incorrect password. Please try again.' }, { status: 401 });
        }

        // Basic blacklist check (repeated digits)
        const isRepeated = /^(.)\1+$/.test(newPin);
        if (isRepeated) {
            return NextResponse.json({ message: 'PIN is too simple. Please choose a more secure PIN.' }, { status: 400 });
        }

        const pinHash = await bcrypt.hash(newPin, 10);
        user.pinHash = pinHash;
        user.isPinSet = true;
        user.pinCreatedAt = new Date();
        await user.save();

        return NextResponse.json({ message: 'Login PIN reset successfully' });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
