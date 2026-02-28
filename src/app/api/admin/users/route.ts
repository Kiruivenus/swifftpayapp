import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    try {
        await dbConnect();

        const query: any = { role: { $ne: 'super_admin' } }; // Hide super admins by default

        if (search) {
            query.$or = [
                { emailNormalized: { $regex: search.toLowerCase(), $options: 'i' } },
                { usernameNormalized: { $regex: search.toLowerCase(), $options: 'i' } },
                { phoneE164: { $regex: search, $options: 'i' } },
            ];
        }

        if (status) query.status = status;
        if (role) query.role = role;

        const [users, total] = await Promise.all([
            User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(query)
        ]);

        return NextResponse.json({
            users,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
