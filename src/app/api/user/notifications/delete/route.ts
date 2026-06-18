import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import UserNotification from '@/models/UserNotification';

export async function POST(req: NextRequest) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { id, all } = await req.json();

        if (all) {
            // Delete all notifications for this user
            await UserNotification.deleteMany({ userId: authUser.id });
            return NextResponse.json({ message: 'All notifications cleared' });
        }

        if (!id) {
            return NextResponse.json({ message: 'Missing notification ID' }, { status: 400 });
        }

        await UserNotification.deleteOne({ _id: id, userId: authUser.id });

        return NextResponse.json({ message: 'Notification deleted' });
    } catch (error: any) {
        console.error('POST Notifications Delete Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
