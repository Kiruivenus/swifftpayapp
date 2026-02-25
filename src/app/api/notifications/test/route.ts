import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import NotificationToken from '@/models/NotificationToken';

// MOCK FCM SEND - In a real app, use 'firebase-admin' SDK
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const tokens = await NotificationToken.find({ userId: user.id });

        if (tokens.length === 0) {
            return NextResponse.json({ message: 'No registered devices found for this user' }, { status: 404 });
        }

        // MOCK LOGIC for sending notification
        console.log(`[FCM TEST] Sending push to ${tokens.length} devices for user ${user.id}`);
        tokens.forEach(t => {
            console.log(`[FCM TEST] Target Token: ${t.fcmToken}`);
        });

        return NextResponse.json({
            message: 'Test notification triggered successfully',
            deviceCount: tokens.length
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
