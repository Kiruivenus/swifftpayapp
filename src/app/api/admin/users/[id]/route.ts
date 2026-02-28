import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        await dbConnect();
        const user = await User.findById(id);
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        return NextResponse.json(user);
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        const body = await req.json();
        await dbConnect();

        const user = await User.findById(id);
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        // Restrictions
        if (user.role === 'super_admin' && admin.role !== 'super_admin') {
            return NextResponse.json({ message: 'Only super admins can modify other super admins.' }, { status: 403 });
        }

        // Prevent escalation: only super_admin can create/promote to super_admin
        if (body.role === 'super_admin' && admin.role !== 'super_admin') {
            return NextResponse.json({ message: 'Only super admins can promote users to super admin.' }, { status: 403 });
        }

        const oldRole = user.role;
        const oldStatus = user.status;

        // Perform update
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true }
        );

        // Audit log
        if (body.role && body.role !== oldRole) {
            await logAdminAction(admin.id, 'CHANGE_ROLE', 'USER', id, `Changed role from ${oldRole} to ${body.role}`);
        }
        if (body.status && body.status !== oldStatus) {
            await logAdminAction(admin.id, body.status === 'BLOCKED' ? 'BLOCK_USER' : 'UNBLOCK_USER', 'USER', id, `Changed status from ${oldStatus} to ${body.status}`);
        }

        return NextResponse.json(updatedUser);

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
