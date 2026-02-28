import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const limit = parseInt(searchParams.get('limit') || '20');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        const query: any = {};
        if (type) query.type = type;

        const [history, total] = await Promise.all([
            RateHistory.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .populate('changedBy', 'username email'),
            RateHistory.countDocuments(query)
        ]);

        return NextResponse.json({
            history,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
