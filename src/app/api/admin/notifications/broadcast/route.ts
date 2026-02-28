import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import NotificationToken from '@/models/NotificationToken';
import { sendPushNotification } from '@/lib/notifications';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.BROADCAST_NOTIFICATIONS);
    if (error) return error;

    try {
        const { title, body, type } = await req.json();
        if (!title || !body) return NextResponse.json({ message: 'Title and body are required' }, { status: 400 });

        await dbConnect();

        // 1. Fetch all user IDs (This could be thousands, so in production we'd use a background queue)
        const users = await User.find({ role: 'user', 'notificationPrefs.enabled': true }, '_id');
        const userIds = users.map(u => u._id.toString());

        // 2. Broadcast (Async)
        // Note: For simplicity, we loop. In production, use a bulk push service.
        for (const userId of userIds) {
            sendPushNotification(userId, title, body, type || 'promotion');
        }

        // 3. Audit log
        await logAdminAction(admin.id, 'BROADCAST_NOTIFICATION', 'SYSTEM', 'GLOBAL', `Broadcasted notification: ${title}`);

        return NextResponse.json({ success: true, message: `Notification broadcasted to ${userIds.length} users.` });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
