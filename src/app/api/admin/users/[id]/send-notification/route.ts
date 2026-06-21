import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        const { title, message, type } = await req.json();

        if (!title || !message) {
            return NextResponse.json({ message: 'Title and message are required.' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById(id);
        if (!user) return NextResponse.json({ message: 'User not found.' }, { status: 404 });

        // Trigger notification
        const notificationType = type || 'SYSTEM'; // BROADCAST, SYSTEM, SECURITY, FINANCE
        await sendNotification(id, title, message, notificationType);

        // Audit Log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'SEND_NOTIFICATION',
            targetType: 'USER',
            targetId: id,
            details: { title, type: notificationType },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, message: 'Notification dispatched successfully.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
