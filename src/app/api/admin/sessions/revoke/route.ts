import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import SecurityEvent from '@/models/SecurityEvent';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_SESSIONS);
    if (error) return error;

    try {
        const { sessionId } = await req.json();
        if (!sessionId) {
            return NextResponse.json({ success: false, message: 'Session ID required' }, { status: 400 });
        }

        await dbConnect();
        const session = await Session.findById(sessionId);
        if (!session) {
            return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
        }

        if (session.status === 'revoked') {
            return NextResponse.json({ success: true, message: 'Session already revoked' });
        }

        session.status = 'revoked';
        session.revokedAt = new Date();
        // Important: Shorten expiry if needed or just let token validation check status
        await session.save();

        // Security Event
        await SecurityEvent.create({
            type: 'SESSION_REVOKED',
            severity: 'low',
            userId: session.userId,
            adminId: admin.id,
            sessionId: session._id,
            message: `Session revoked by admin ${admin.name || admin.email}`,
            metadata: { ip: req.headers.get('x-forwarded-for') }
        });

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'REVOKE_SESSION',
            targetType: 'USER',
            targetId: session.userId,
            details: { sessionId, revokedAt: new Date() },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown'
        });

        return NextResponse.json({ success: true, message: 'Session revoked successfully' });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
