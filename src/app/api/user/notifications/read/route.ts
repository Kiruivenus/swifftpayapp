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
            // Mark all as read for this user
            await UserNotification.updateMany(
                { userId: authUser.id, read: false },
                { $set: { read: true } }
            );
            return NextResponse.json({ message: 'All notifications marked as read' });
        }

        if (!id) {
            return NextResponse.json({ message: 'Missing notification ID' }, { status: 400 });
        }

        await UserNotification.updateOne(
            { _id: id, userId: authUser.id },
            { $set: { read: true } }
        );

        return NextResponse.json({ message: 'Notification marked as read' });
    } catch (error: any) {
        console.error('POST Notifications Read Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
