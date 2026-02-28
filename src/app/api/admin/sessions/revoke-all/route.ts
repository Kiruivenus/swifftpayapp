import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import SecurityEvent from '@/models/SecurityEvent';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS, ROLES } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_SESSIONS);
    if (error) return error;

    try {
        const { userId } = await req.json();
        const isGlobal = !userId;

        // Global revoke requires SUPER_ADMIN
        if (isGlobal && admin.role !== ROLES.SUPER_ADMIN) {
            return NextResponse.json({
                success: false,
                code: 'FORBIDDEN',
                message: 'Global session revocation requires Super Admin privileges.'
            }, { status: 403 });
        }

        await dbConnect();
        const query: any = { status: 'active' };
        if (userId) query.userId = userId;

        const result = await Session.updateMany(
            query,
            {
                $set: {
                    status: 'revoked',
                    revokedAt: new Date()
                }
            }
        );

        // Security Event
        await SecurityEvent.create({
            type: 'SESSION_REVOKED',
            severity: isGlobal ? 'high' : 'medium',
            userId: userId || null,
            adminId: admin.id,
            message: isGlobal
                ? `Global session purge initiated by ${admin.name || admin.email}`
                : `All sessions for user ${userId} revoked by admin ${admin.name || admin.email}`,
            metadata: { ip: req.headers.get('x-forwarded-for'), count: result.modifiedCount }
        });

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'REVOKE_ALL_SESSIONS',
            targetType: isGlobal ? 'SYSTEM' : 'USER',
            targetId: userId || 'GLOBAL',
            details: { count: result.modifiedCount, isGlobal },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown'
        });

        return NextResponse.json({
            success: true,
            message: `Successfully revoked ${result.modifiedCount} sessions.`,
            count: result.modifiedCount
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
