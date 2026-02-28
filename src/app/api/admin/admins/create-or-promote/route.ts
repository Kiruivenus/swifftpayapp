import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS, ROLES } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_ADMINS);
    if (error) return error;

    try {
        const { userId, role } = await req.json();

        if (!userId || !role) {
            return NextResponse.json({ message: 'User ID and role are required' }, { status: 400 });
        }

        // Validate role
        const allowedRoles = Object.values(ROLES).filter(r => r !== 'user' && r !== 'super_admin');
        if (!allowedRoles.includes(role)) {
            return NextResponse.json({ message: 'Invalid admin role' }, { status: 400 });
        }

        await dbConnect();

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'PROMOTE_ADMIN',
            targetType: 'USER',
            targetId: userId,
            details: {
                oldRole,
                newRole: role,
                reason: 'Administrative promotion'
            },
            severity: 'WARNING'
        });

        return NextResponse.json({
            message: `User ${user.username} promoted to ${role}`,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
