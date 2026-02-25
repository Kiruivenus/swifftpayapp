import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import NotificationToken from '@/models/NotificationToken';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { token, deviceId, platform } = await req.json();

        if (!token || !deviceId) {
            return NextResponse.json({ message: 'Token and deviceId are required' }, { status: 400 });
        }

        await NotificationToken.findOneAndUpdate(
            { userId: user.id, deviceId },
            {
                fcmToken: token,
                platform: platform || 'android',
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ message: 'Token registered successfully' });
    } catch (error: any) {
        console.error('FCM Registration Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
