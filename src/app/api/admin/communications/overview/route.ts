import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Broadcast from '@/models/Broadcast';
import NotificationSettings from '@/models/NotificationSettings';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS); // AUDIT_LOGS or similar for viewing
    if (error) return error;

    try {
        await dbConnect();

        const [settings, recentBroadcasts] = await Promise.all([
            (NotificationSettings as any).getSettings(),
            Broadcast.find()
                .sort({ createdAt: -1 })
                .limit(20)
                .populate('createdByAdminId', 'name email')
        ]);

        return NextResponse.json({
            success: true,
            data: {
                settings,
                recentBroadcasts
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
