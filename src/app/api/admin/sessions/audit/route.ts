import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SecurityEvent from '@/models/SecurityEvent';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.VIEW_SESSIONS);
    if (error) return error;

    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');
        const severity = searchParams.get('severity');
        const type = searchParams.get('type');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const query: any = {};
        if (severity) query.severity = severity;
        if (type) query.type = type;

        if (q) {
            // Text search by user or messages
            const matchingUsers = await User.find({
                $or: [
                    { username: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);

            query.$or = [
                { userId: { $in: userIds } },
                { message: { $regex: q, $options: 'i' } },
                { ip: { $regex: q, $options: 'i' } }
            ];
        }

        const count = await SecurityEvent.countDocuments(query);
        const logs = await SecurityEvent.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username email role')
            .populate('adminId', 'username email role');

        return NextResponse.json({
            success: true,
            logs,
            pagination: {
                total: count,
                pages: Math.ceil(count / limit),
                page,
                limit
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
