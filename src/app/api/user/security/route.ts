import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { action, pin, enabled } = await req.json();
        await dbConnect();

        if (action === 'set-pin') {
            if (!pin || pin.length < 4) {
                return NextResponse.json({ message: 'Invalid PIN' }, { status: 400 });
            }
            const pinHash = await bcrypt.hash(pin, 10);
            await User.findByIdAndUpdate(user.id, { pinHash, isPinSet: true });
            return NextResponse.json({ message: 'PIN updated successfully' });
        }

        if (action === 'toggle-biometric') {
            await User.findByIdAndUpdate(user.id, { biometricEnabled: enabled });
            return NextResponse.json({ message: `Biometrics ${enabled ? 'enabled' : 'disabled'}` });
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
