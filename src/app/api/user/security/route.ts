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

        if (action === 'change-pin') {
            const { oldPin, newPin } = await req.json();
            if (!oldPin || !newPin || newPin.length < 4) {
                return NextResponse.json({ message: 'Invalid PIN data' }, { status: 400 });
            }

            const dbUser = await User.findById(user.id);
            if (!dbUser || !dbUser.pinHash) {
                return NextResponse.json({ message: 'PIN not set' }, { status: 404 });
            }

            const isMatch = await bcrypt.compare(oldPin, dbUser.pinHash);
            if (!isMatch) {
                return NextResponse.json({ message: 'Incorrect old PIN' }, { status: 401 });
            }

            const newPinHash = await bcrypt.hash(newPin, 10);
            await User.findByIdAndUpdate(user.id, { pinHash: newPinHash });
            return NextResponse.json({ message: 'PIN changed successfully' });
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
