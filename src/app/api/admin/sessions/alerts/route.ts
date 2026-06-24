import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SecurityEvent from '@/models/SecurityEvent';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.VIEW_SESSIONS);
    if (error) return error;

    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const severity = searchParams.get('severity');
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        const query: any = {};
        if (severity) query.severity = severity;
        if (status) query.status = status;
        if (type) query.type = type;

        const alerts = await SecurityEvent.find(query)
            .sort({ createdAt: -1 })
            .populate('userId', 'username email role phone')
            .limit(100);

        return NextResponse.json({ success: true, alerts });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_SESSIONS);
    if (error) return error;

    try {
        const body = await req.json();
        const { alertId, status, resolutionNotes } = body;

        if (!alertId || !status) {
            return NextResponse.json({ success: false, message: 'Alert ID and Status are required.' }, { status: 400 });
        }

        await dbConnect();
        const alert = await SecurityEvent.findById(alertId);

        if (!alert) {
            return NextResponse.json({ success: false, message: 'Security incident alert not found.' }, { status: 404 });
        }

        const before = JSON.parse(JSON.stringify(alert));

        alert.status = status;
        if (resolutionNotes !== undefined) alert.resolutionNotes = resolutionNotes;
        if (status === 'RESOLVED') {
            alert.resolvedAt = new Date();
        } else {
            alert.resolvedAt = null;
        }

        await alert.save();

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'RESOLVE_SECURITY_INCIDENT',
            targetType: 'SYSTEM',
            targetId: alertId,
            details: { before, after: alert, resolutionNotes },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown'
        });

        return NextResponse.json({ success: true, message: 'Security alert updated.', alert });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
