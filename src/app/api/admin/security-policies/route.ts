import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SecurityPolicy from '@/models/SecurityPolicy';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS, ROLES } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function PUT(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    // Only SUPER_ADMIN can change security policies
    if (admin.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json({
            success: false,
            code: 'FORBIDDEN',
            message: 'Only Super Admins can modify global security policies.'
        }, { status: 403 });
    }

    try {
        const body = await req.json();
        await dbConnect();

        const policies = await (SecurityPolicy as any).getSettings();
        const before = JSON.parse(JSON.stringify(policies));

        // Update allowed fields
        const allowedFields = [
            'mandatory2faForAdmins',
            'blockNonKenyanIps',
            'allowedCountries',
            'sessionMaxAgeHours',
            'maxFailedLogins',
            'lockoutMinutes'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                policies[field] = body[field];
            }
        });

        policies.updatedAt = new Date();
        policies.updatedBy = admin.id;
        await policies.save();

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'UPDATE_SECURITY_POLICIES',
            targetType: 'SYSTEM',
            targetId: 'GLOBAL',
            details: { before, after: policies },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown',
            severity: 'high'
        });

        return NextResponse.json({ success: true, data: policies });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
