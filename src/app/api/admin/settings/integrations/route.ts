import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformSettings from '@/models/PlatformSettings';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { encrypt, maskSecret } from '@/lib/encryption';
import { logAdminAction } from '@/lib/audit';

export async function PUT(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    // Strict check for SUPER_ADMIN for sensitive keys
    if (admin.role !== 'super_admin') {
        return NextResponse.json({ message: 'Access denied. Super Admin role required for integration secrets.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            mpesaConsumerKey, mpesaConsumerSecret, mpesaPasskey, mpesaShortCode, mpesaEnvironment,
            sendgridApiKey, smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom
        } = body;

        await dbConnect();
        const settings = await (PlatformSettings as any).getSettings();

        // Track what changed for audit (masked)
        const changes: any = {};

        if (mpesaConsumerKey) {
            settings.mpesaConsumerKey = encrypt(mpesaConsumerKey);
            changes.mpesaConsumerKey = 'UPDATED';
        }
        if (mpesaConsumerSecret) {
            settings.mpesaConsumerSecret = encrypt(mpesaConsumerSecret);
            changes.mpesaConsumerSecret = 'UPDATED';
        }
        if (mpesaPasskey) {
            settings.mpesaPasskey = encrypt(mpesaPasskey);
            changes.mpesaPasskey = 'UPDATED';
        }
        if (mpesaShortCode !== undefined) settings.mpesaShortCode = mpesaShortCode;
        if (mpesaEnvironment !== undefined) settings.mpesaEnvironment = mpesaEnvironment;

        if (sendgridApiKey) {
            settings.sendgridApiKey = encrypt(sendgridApiKey);
            changes.sendgridApiKey = 'UPDATED';
        }

        if (smtpHost !== undefined) settings.smtpHost = smtpHost;
        if (smtpPort !== undefined) settings.smtpPort = smtpPort;
        if (smtpUser !== undefined) settings.smtpUser = smtpUser;
        if (smtpPass) {
            settings.smtpPass = encrypt(smtpPass);
            changes.smtpPass = 'UPDATED';
        }
        if (smtpFrom !== undefined) settings.smtpFrom = smtpFrom;

        settings.updatedBy = admin.id;
        settings.updatedAt = new Date();
        await settings.save();

        // Audit log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'UPDATE_INTEGRATION_KEYS',
            targetType: 'SYSTEM',
            targetId: 'GLOBAL',
            details: { changes },
            ipAddress: ip,
            userAgent: ua,
            severity: 'CRITICAL'
        });

        return NextResponse.json({ success: true, message: 'Integration keys updated securely.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
