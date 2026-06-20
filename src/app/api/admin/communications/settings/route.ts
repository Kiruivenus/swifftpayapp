import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import NotificationSettings from '@/models/NotificationSettings';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function PUT(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        const body = await req.json();
        await dbConnect();

        const settings = await (NotificationSettings as any).getSettings();
        const before = JSON.parse(JSON.stringify(settings));

        const allowedFields = [
            'newLoginDetected', 'kycStatusUpdates', 'depositSuccessful', 'withdrawalProcessed',
            'failedLoginAttempts', 'passwordChanged', 'newDeviceLogin', 'withdrawalRejected',
            'depositFailed', 'kycSubmitted', 'kycApproved', 'kycRejected',
            'referralReward', 'accountSuspended', 'maintenanceAlerts'
        ];
        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                settings[field] = body[field];
            }
        });

        settings.updatedBy = admin.id;
        await settings.save();

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'UPDATE_ALERT_SETTINGS',
            targetType: 'SYSTEM',
            targetId: 'GLOBAL_NOTIFICATIONS',
            details: { before, after: settings },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown',
            severity: 'WARNING'
        });

        return NextResponse.json({ success: true, data: settings });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
