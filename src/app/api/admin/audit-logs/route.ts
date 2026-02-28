import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminLog from '@/models/AdminLog';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.VIEW_AUDIT_LOGS);
    if (error) return error;

    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const actionType = searchParams.get('actionType');
        const severity = searchParams.get('severity');
        const actorId = searchParams.get('actorId');
        const targetType = searchParams.get('targetType');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        // Build query
        const query: any = {};

        if (q) {
            query.$text = { $search: q };
        }
        if (from || to) {
            query.timestamp = {};
            if (from) query.timestamp.$gte = new Date(from);
            if (to) query.timestamp.$lte = new Date(to);
        }
        if (actionType) query.actionType = actionType;
        if (severity) query.severity = severity;
        if (actorId) query.actorId = actorId;
        if (targetType) query.targetType = targetType;

        // Execute query
        const items = await AdminLog.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);

        const total = await AdminLog.countDocuments(query);

        // Stats (server computed)
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [totalLast24h, criticalLast24h, systemLast24h] = await Promise.all([
            AdminLog.countDocuments({ timestamp: { $gte: last24h } }),
            AdminLog.countDocuments({ timestamp: { $gte: last24h }, severity: 'CRITICAL' }),
            AdminLog.countDocuments({ timestamp: { $gte: last24h }, actorType: 'SYSTEM' })
        ]);

        return NextResponse.json({
            items,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            stats: {
                last24h: totalLast24h,
                criticalLast24h: criticalLast24h,
                automationLast24h: systemLast24h
            }
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
