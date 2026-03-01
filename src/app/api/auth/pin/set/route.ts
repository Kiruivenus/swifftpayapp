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

        const { pin } = await req.json();

        if (!pin || pin.length < 4) {
            return NextResponse.json({ message: 'PIN must be at least 4 digits.' }, { status: 400 });
        }

        // Basic blacklist check (repeated digits)
        const isRepeated = /^(.)\1+$/.test(pin);
        const isSequential = "0123456789".includes(pin) || "9876543210".includes(pin);

        if (isRepeated || isSequential) {
            return NextResponse.json({ message: 'PIN is too simple. Please choose a more secure PIN.' }, { status: 400 });
        }

        const pinHash = await bcrypt.hash(pin, 10);

        await User.findByIdAndUpdate(user.id, {
            pinHash,
            isPinSet: true,
            pinCreatedAt: new Date()
        });

        return NextResponse.json({ message: 'Login PIN created successfully' });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
