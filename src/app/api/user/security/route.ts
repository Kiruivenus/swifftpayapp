import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, pin, enabled, oldPin, newPin } = body;
        await dbConnect();

        if (action === 'verify-pin') {
            if (!pin) {
                return NextResponse.json({ message: 'PIN required' }, { status: 400 });
            }
            const dbUser = await User.findById(user.id);
            if (!dbUser || !dbUser.pinHash) {
                return NextResponse.json({ message: 'PIN not set' }, { status: 404 });
            }
            const isMatch = await bcrypt.compare(pin, dbUser.pinHash);
            if (!isMatch) {
                return NextResponse.json({ message: 'Incorrect PIN' }, { status: 401 });
            }
            return NextResponse.json({ message: 'PIN verified' });
        }

        if (action === 'set-pin') {
            if (!pin || pin.length < 4) {
                return NextResponse.json({ message: 'Invalid PIN' }, { status: 400 });
            }
            const pinHash = await bcrypt.hash(pin, 10);
            await User.findByIdAndUpdate(user.id, { pinHash, isPinSet: true });

            // Trigger Notification
            await sendNotification(
                user.id,
                "Security Alert",
                "A new Login PIN has been set for your account.",
                'SECURITY'
            );

            return NextResponse.json({ message: 'PIN updated successfully' });
        }

        if (action === 'change-pin') {
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

            // Trigger Notification
            await sendNotification(
                user.id,
                "Security Alert",
                "Your Login PIN was recently changed.",
                'SECURITY'
            );

            return NextResponse.json({ message: 'PIN changed successfully' });
        }

        if (action === 'toggle-biometric') {
            await User.findByIdAndUpdate(user.id, { biometricEnabled: enabled });

            // Trigger Notification
            await sendNotification(
                user.id,
                "Security Alert",
                `Biometric login has been ${enabled ? 'enabled' : 'disabled'}.`,
                'SECURITY'
            );

            return NextResponse.json({ message: `Biometrics ${enabled ? 'enabled' : 'disabled'}` });
        }

        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
