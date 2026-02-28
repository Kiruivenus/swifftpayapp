import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import TrustedDevice from '@/models/TrustedDevice';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_SESSIONS);
    if (error) return error;

    try {
        const { sessionId, trusted } = await req.json();
        if (!sessionId) {
            return NextResponse.json({ success: false, message: 'Session ID required' }, { status: 400 });
        }

        await dbConnect();
        const session = await Session.findById(sessionId);
        if (!session) {
            return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
        }

        session.isTrusted = trusted;
        session.trustedAt = trusted ? new Date() : null;
        session.trustedBy = trusted ? admin.id : null;
        await session.save();

        // Update TrustedDevice model if it exists for this device
        if (session.deviceId) {
            await TrustedDevice.findOneAndUpdate(
                { userId: session.userId, deviceId: session.deviceId },
                {
                    $set: {
                        lastUsedAt: new Date(),
                        revokedAt: trusted ? null : new Date()
                    }
                },
                { upsert: trusted }
            );
        }

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'TRUST_DEVICE',
            targetType: 'USER',
            targetId: session.userId,
            details: { sessionId, deviceId: session.deviceId, trusted },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown'
        });

        return NextResponse.json({ success: true, data: session });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
