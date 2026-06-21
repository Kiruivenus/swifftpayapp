import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import User from '@/models/User';
import SecurityEvent from '@/models/SecurityEvent';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        await dbConnect();
        const user = await User.findById(id);
        if (!user) return NextResponse.json({ message: 'User not found.' }, { status: 404 });

        // Revoke active sessions
        const res = await Session.updateMany(
            { userId: id, status: 'active' },
            { $set: { status: 'revoked' } }
        );

        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        // Write Security Event on user profile
        await SecurityEvent.create({
            type: 'SESSION_REVOKED',
            severity: 'medium',
            userId: id,
            adminId: admin.id,
            ip,
            userAgent: ua,
            message: `All active sessions revoked by Administrator ${admin.name || admin.email}.`
        });

        // Write Admin Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'FORCE_LOGOUT',
            targetType: 'USER',
            targetId: id,
            details: { username: user.username, sessionsRevoked: res.modifiedCount },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, message: `Successfully logged user out of ${res.modifiedCount} active devices.` });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
