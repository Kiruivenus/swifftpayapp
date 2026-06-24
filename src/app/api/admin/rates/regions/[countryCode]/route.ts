import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Region from '@/models/Region';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ countryCode: string }> }) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const { countryCode } = await params;
        const body = await req.json();

        await dbConnect();
        const region = await Region.findOne({ countryCode: countryCode.toUpperCase() });

        if (!region) {
            return NextResponse.json({ success: false, message: 'Region not found.' }, { status: 404 });
        }

        const before = JSON.parse(JSON.stringify(region));

        // Update fields if provided
        if (body.enabled !== undefined) region.enabled = body.enabled;
        if (body.currencyCode !== undefined) region.currencyCode = body.currencyCode;
        if (body.phonePrefix !== undefined) region.phonePrefix = body.phonePrefix;
        if (body.defaultForNewUsers !== undefined) region.defaultForNewUsers = body.defaultForNewUsers;
        
        if (body.status !== undefined) {
            region.status = body.status;
            region.enabled = body.status === 'ENABLED'; // sync enabled toggle
        }
        if (body.operationalHealth !== undefined) region.operationalHealth = body.operationalHealth;
        if (body.paymentMethods !== undefined) region.paymentMethods = body.paymentMethods;
        if (body.withdrawalMethods !== undefined) region.withdrawalMethods = body.withdrawalMethods;
        if (body.kycRequirements !== undefined) region.kycRequirements = body.kycRequirements;
        if (body.taxRules !== undefined) {
            region.taxRules = {
                withholdingTaxPercent: body.taxRules.withholdingTaxPercent !== undefined ? body.taxRules.withholdingTaxPercent : region.taxRules?.withholdingTaxPercent,
                vatPercent: body.taxRules.vatPercent !== undefined ? body.taxRules.vatPercent : region.taxRules?.vatPercent
            };
        }
        if (body.limits !== undefined) {
            region.limits = {
                dailyMax: body.limits.dailyMax !== undefined ? body.limits.dailyMax : region.limits?.dailyMax,
                lifetimeMax: body.limits.lifetimeMax !== undefined ? body.limits.lifetimeMax : region.limits?.lifetimeMax
            };
        }

        region.updatedBy = admin.id;
        region.updatedAt = new Date();
        await region.save();

        // Write History
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await RateHistory.create({
            type: 'region',
            before,
            after: region,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'UPDATE_REGION',
            targetType: 'REGION',
            targetId: region._id.toString(),
            details: { before, after: region },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, data: region });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
