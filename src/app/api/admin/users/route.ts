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
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const kycStatus = searchParams.get('kycStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    try {
        await dbConnect();

        const query: any = { role: { $ne: 'super_admin' } };

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { email: searchRegex },
                { emailNormalized: searchRegex },
                { username: searchRegex },
                { usernameNormalized: searchRegex },
                { phoneE164: { $regex: search } },
                { fullName: searchRegex }
            ];
            // If valid ID
            if (search.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({ _id: search });
            }
        }

        if (status) query.status = status;
        if (role) query.role = role;
        if (kycStatus) query.kycStatus = kycStatus;

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
