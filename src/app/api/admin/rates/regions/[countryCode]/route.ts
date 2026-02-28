import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Region from '@/models/Region';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

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

        return NextResponse.json({ success: true, data: region });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
