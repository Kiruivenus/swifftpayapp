import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformSettings from '@/models/PlatformSettings';
import SecurityPolicy from '@/models/SecurityPolicy';
import User from '@/models/User';
import Session from '@/models/Session';
import SecurityEvent from '@/models/SecurityEvent';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS, ROLES } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_SESSIONS);
    if (error) return error;

    // Emergency platform-wide circuit breakers require SUPER_ADMIN
    if (admin.role !== ROLES.SUPER_ADMIN) {
        return NextResponse.json({
            success: false,
            code: 'FORBIDDEN',
            message: 'Emergency platform locks require Super Admin roles.'
        }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { action, targetUserId, regionCode } = body;

        if (!action) {
            return NextResponse.json({ success: false, message: 'Emergency action type is required.' }, { status: 400 });
        }

        await dbConnect();
        const settings = await (PlatformSettings as any).getSettings();
        const policies = await (SecurityPolicy as any).getSettings();

        let message = '';
        const details: any = { action };

        if (action === 'LOCK_PLATFORM') {
            settings.maintenanceMode = true;
            settings.maintenanceMessage = 'Emergency platform lock active. System operations are temporarily suspended by Security Operations.';
            await settings.save();
            message = 'Emergency platform operations locked successfully.';
            
            // Terminate all current web/mobile user sessions (except this admin)
            const result = await Session.updateMany(
                { userId: { $ne: admin.id }, status: 'active' },
                { $set: { status: 'revoked', revokedAt: new Date() } }
            );
            details.terminatedSessionsCount = result.modifiedCount;

            await SecurityEvent.create({
                type: 'EMERGENCY_LOCK',
                severity: 'high',
                adminId: admin.id,
                message: 'EMERGENCY platform lock initiated. All active user sessions revoked.'
            });

        } else if (action === 'FREEZE_SUSPICIOUS_ACCOUNTS') {
            // Find users who have failed login security events in the last 24 hours
            const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const suspiciousUserIds = await SecurityEvent.distinct('userId', {
                type: { $in: ['FAILED_LOGIN', 'SUSPICIOUS_LOGIN'] },
                createdAt: { $gte: dayAgo }
            });

            // Exclude admins and block those users
            const result = await User.updateMany(
                { _id: { $in: suspiciousUserIds }, role: 'user' },
                { $set: { status: 'BLOCKED' } }
            );
            details.frozenAccountsCount = result.modifiedCount;
            message = `Successfully suspended ${result.modifiedCount} suspicious accounts.`;

            // Revoke active sessions for those frozen users
            await Session.updateMany(
                { userId: { $in: suspiciousUserIds }, status: 'active' },
                { $set: { status: 'revoked', revokedAt: new Date() } }
            );

        } else if (action === 'FORCE_PASSWORD_RESET') {
            if (targetUserId) {
                // Force specific user
                const target = await User.findById(targetUserId);
                if (!target) return NextResponse.json({ success: false, message: 'Target user not found' }, { status: 404 });
                // We'll update their password to a random value to force reset via email
                target.password = 'FORCE_RESET_' + require('crypto').randomBytes(8).toString('hex');
                await target.save();
                message = `Forced password reset requirement for user ${target.username || target.email}.`;
                
                await Session.updateMany({ userId: targetUserId }, { $set: { status: 'revoked', revokedAt: new Date() } });
            } else {
                return NextResponse.json({ success: false, message: 'Target User ID is required to force reset.' }, { status: 400 });
            }

        } else if (action === 'DISABLE_NEW_LOGINS') {
            settings.registrationEnabled = false;
            await settings.save();
            message = 'New account registrations disabled globally.';

        } else if (action === 'DISABLE_REGION') {
            if (!regionCode) return NextResponse.json({ success: false, message: 'Region country code is required.' }, { status: 400 });
            if (!policies.ipBlacklist.includes(regionCode)) {
                policies.ipBlacklist.push(regionCode);
                await policies.save();
            }
            message = `Geo-blocked country region: ${regionCode}`;
            details.blockedRegion = regionCode;

        } else if (action === 'UNFREEZE_PLATFORM') {
            settings.maintenanceMode = false;
            settings.registrationEnabled = true;
            await settings.save();
            message = 'Emergency platform locks cleared. Normal services resumed.';

            await SecurityEvent.create({
                type: 'SENSITIVE_ACTION',
                severity: 'medium',
                adminId: admin.id,
                message: 'EMERGENCY platform lock deactivated. System services restored.'
            });

        } else {
            return NextResponse.json({ success: false, message: 'Invalid emergency action specified.' }, { status: 400 });
        }

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'EMERGENCY_SECURITY_CONTROL',
            targetType: 'SYSTEM',
            targetId: 'GLOBAL',
            details,
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown',
            severity: 'CRITICAL'
        });

        return NextResponse.json({ success: true, message });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
