import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        const { password } = await req.json();
        if (!password || password.length < 8) {
            return NextResponse.json({ message: 'Password must be at least 8 characters long.' }, { status: 400 });
        }

        await dbConnect();
        const user = await User.findById(id);
        if (!user) return NextResponse.json({ message: 'User not found.' }, { status: 404 });

        // Restrictions
        if (user.role === 'super_admin' && admin.role !== 'super_admin') {
            return NextResponse.json({ message: 'Only super admins can reset passwords for other super admins.' }, { status: 403 });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user.password = passwordHash;
        await user.save();

        // Audit Log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'RESET_PASSWORD',
            targetType: 'USER',
            targetId: id,
            details: { username: user.username },
            ipAddress: ip,
            userAgent: ua,
            severity: 'WARNING'
        });

        return NextResponse.json({ success: true, message: 'User password reset successful.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
