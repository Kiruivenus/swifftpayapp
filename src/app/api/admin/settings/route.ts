import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformSettings from '@/models/PlatformSettings';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { maskSecret } from '@/lib/encryption';

export async function GET(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        await dbConnect();
        const settings = await (PlatformSettings as any).getSettings();

        // Check if admin is SUPER_ADMIN to decide masking/permission flags
        const isSuperAdmin = admin.role === 'super_admin';

        // Prepare safe response (Mask encrypted fields)
        const safeSettings = {
            ...settings.toObject(),
            // Mask secrets
            mpesaConsumerKey: maskSecret(settings.mpesaConsumerKey),
            mpesaConsumerSecret: maskSecret(settings.mpesaConsumerSecret),
            mpesaPasskey: maskSecret(settings.mpesaPasskey),
            sendgridApiKey: maskSecret(settings.sendgridApiKey),
            smtpPass: maskSecret(settings.smtpPass),

            // Permissions for UI
            canEditSecrets: isSuperAdmin,
            canEditBrandAssets: isSuperAdmin
        };

        return NextResponse.json(safeSettings);
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
