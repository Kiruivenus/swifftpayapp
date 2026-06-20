import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformSettings from '@/models/PlatformSettings';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function PUT(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        const body = await req.json();
        const { 
            platformName, 
            supportEmail, 
            maintenanceMode, 
            maintenanceMessage,
            referralEnabled,
            referralMinRewardUsd,
            referralMaxRewardUsd,
            referralCardSpendRequirementUsd,
            referralCardSpendDaysLimit,
            referralDepositRequirementUsd
        } = body;

        await dbConnect();
        const settings = await (PlatformSettings as any).getSettings();

        const before = {
            platformName: settings.platformName,
            supportEmail: settings.supportEmail,
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            referralEnabled: settings.referralEnabled,
            referralMinRewardUsd: settings.referralMinRewardUsd,
            referralMaxRewardUsd: settings.referralMaxRewardUsd,
            referralCardSpendRequirementUsd: settings.referralCardSpendRequirementUsd,
            referralCardSpendDaysLimit: settings.referralCardSpendDaysLimit,
            referralDepositRequirementUsd: settings.referralDepositRequirementUsd
        };

        // Update fields
        if (platformName !== undefined) settings.platformName = platformName;
        if (supportEmail !== undefined) settings.supportEmail = supportEmail;
        if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
        if (maintenanceMessage !== undefined) settings.maintenanceMessage = maintenanceMessage;
        if (referralEnabled !== undefined) settings.referralEnabled = referralEnabled;
        if (referralMinRewardUsd !== undefined) settings.referralMinRewardUsd = Number(referralMinRewardUsd);
        if (referralMaxRewardUsd !== undefined) settings.referralMaxRewardUsd = Number(referralMaxRewardUsd);
        if (referralCardSpendRequirementUsd !== undefined) settings.referralCardSpendRequirementUsd = Number(referralCardSpendRequirementUsd);
        if (referralCardSpendDaysLimit !== undefined) settings.referralCardSpendDaysLimit = Number(referralCardSpendDaysLimit);
        if (referralDepositRequirementUsd !== undefined) settings.referralDepositRequirementUsd = Number(referralDepositRequirementUsd);

        settings.updatedBy = admin.id;
        settings.updatedAt = new Date();
        await settings.save();

        const after = {
            platformName: settings.platformName,
            supportEmail: settings.supportEmail,
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            referralEnabled: settings.referralEnabled,
            referralMinRewardUsd: settings.referralMinRewardUsd,
            referralMaxRewardUsd: settings.referralMaxRewardUsd,
            referralCardSpendRequirementUsd: settings.referralCardSpendRequirementUsd,
            referralCardSpendDaysLimit: settings.referralCardSpendDaysLimit,
            referralDepositRequirementUsd: settings.referralDepositRequirementUsd
        };

        // Audit log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'UPDATE_SETTINGS',
            targetType: 'SYSTEM',
            targetId: 'GLOBAL',
            details: { before, after },
            ipAddress: ip,
            userAgent: ua,
            severity: maintenanceMode !== before.maintenanceMode ? 'WARNING' : 'INFO'
        });

        return NextResponse.json({ success: true, message: 'General settings updated.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
