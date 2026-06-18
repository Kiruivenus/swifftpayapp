import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import UserNotification from '@/models/UserNotification';

export async function GET(req: NextRequest) {
    try {
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Retrieve notifications for user, sorted by most recent
        const notifications = await UserNotification.find({ userId: authUser.id })
            .sort({ createdAt: -1 })
            .limit(50); // limit to recent 50

        // Map to client expected structure
        const mapped = notifications.map(n => ({
            id: n._id.toString(),
            userId: n.userId.toString(),
            title: n.title,
            message: n.message,
            type: n.type || 'SYSTEM',
            category: n.type === 'FINANCE' ? 'transactions' : 'alerts',
            isRead: n.read || false,
            createdAt: n.createdAt ? new Date(n.createdAt).getTime() : Date.now()
        }));

        return NextResponse.json(mapped);
    } catch (error: any) {
        console.error('GET Notifications History Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
