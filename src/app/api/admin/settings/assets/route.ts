import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformSettings from '@/models/PlatformSettings';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { saveImage } from '@/lib/storage';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    // Strict check for SUPER_ADMIN for brand assets
    if (admin.role !== 'super_admin') {
        return NextResponse.json({ message: 'Access denied. Super Admin role required for brand assets.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { type, image } = body; 

        if (!image) {
            return NextResponse.json({ message: 'Image data is required.' }, { status: 400 });
        }

        await dbConnect();
        const settings = await (PlatformSettings as any).getSettings();

        const imageUrl = await saveImage(image, 'branding');

        const before = { 
            logoUrl: settings.logoUrl, 
            logoDashboardUrl: settings.logoDashboardUrl,
            logoMobileUrl: settings.logoMobileUrl,
            logoEmailUrl: settings.logoEmailUrl,
            faviconUrl: settings.faviconUrl,
            notificationIconUrl: settings.notificationIconUrl
        };

        if (type === 'logo') {
            settings.logoUrl = imageUrl;
        } else if (type === 'logoDashboard') {
            settings.logoDashboardUrl = imageUrl;
        } else if (type === 'logoMobile') {
            settings.logoMobileUrl = imageUrl;
        } else if (type === 'logoEmail') {
            settings.logoEmailUrl = imageUrl;
        } else if (type === 'favicon') {
            settings.faviconUrl = imageUrl;
        } else if (type === 'notificationIcon') {
            settings.notificationIconUrl = imageUrl;
        } else {
            return NextResponse.json({ message: 'Invalid asset type.' }, { status: 400 });
        }

        settings.updatedBy = admin.id;
        settings.updatedAt = new Date();
        await settings.save();

        const after = { 
            logoUrl: settings.logoUrl, 
            logoDashboardUrl: settings.logoDashboardUrl,
            logoMobileUrl: settings.logoMobileUrl,
            logoEmailUrl: settings.logoEmailUrl,
            faviconUrl: settings.faviconUrl,
            notificationIconUrl: settings.notificationIconUrl
        };

        // Audit log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'UPLOAD_BRAND_ASSETS',
            targetType: 'SYSTEM',
            targetId: 'GLOBAL',
            details: { type, before, after },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, url: imageUrl, message: `${type} updated successfully.` });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
