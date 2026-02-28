import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminLog from '@/models/AdminLog';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
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

        // Build query
        const query: any = {};
        if (q) query.$text = { $search: q };
        if (from || to) {
            query.timestamp = {};
            if (from) query.timestamp.$gte = new Date(from);
            if (to) query.timestamp.$lte = new Date(to);
        }
        if (actionType) query.actionType = actionType;
        if (severity) query.severity = severity;
        if (actorId) query.actorId = actorId;
        if (targetType) query.targetType = targetType;

        // Fetch all matching logs for export (up to 5000 for safety)
        const items = await AdminLog.find(query).sort({ timestamp: -1 }).limit(5000);

        // CSV Header
        const header = ['Timestamp', 'ActorType', 'ActorName', 'ActorRole', 'Action', 'TargetType', 'TargetID', 'Severity', 'IP', 'UserAgent', 'Details'];

        const csvRows = [
            header.join(','),
            ...items.map(m => [
                m.timestamp.toISOString(),
                m.actorType,
                m.actorName || m.actorId,
                m.actorRole || 'Unknown',
                m.actionType,
                m.targetType,
                m.targetId || '',
                m.severity,
                m.ipAddress || 'Unknown',
                m.userAgent || 'Unknown',
                JSON.stringify(m.details || {}).replace(/"/g, '""')
            ].map(v => `"${v}"`).join(','))
        ];

        return new NextResponse(csvRows.join('\n'), {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
