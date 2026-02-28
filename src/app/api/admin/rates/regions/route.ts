import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Region from '@/models/Region';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        await dbConnect();
        const regions = await Region.find().sort({ countryName: 1 });
        return NextResponse.json(regions);
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const body = await req.json();
        const { countryName, countryCode, currencyCode, phonePrefix, enabled = true } = body;

        if (!countryName || !countryCode || !currencyCode || !phonePrefix) {
            return NextResponse.json({
                success: false,
                message: 'Missing required fields: countryName, countryCode, currencyCode, phonePrefix'
            }, { status: 400 });
        }

        await dbConnect();

        // Check if exists
        const existing = await Region.findOne({
            $or: [
                { countryCode: countryCode.toUpperCase() },
                { countryName }
            ]
        });

        if (existing) {
            return NextResponse.json({
                success: false,
                message: 'Region with this name or code already exists.'
            }, { status: 409 });
        }

        const newRegion = await Region.create({
            countryName,
            countryCode: countryCode.toUpperCase(),
            currencyCode: currencyCode.toUpperCase(),
            phonePrefix,
            enabled,
            updatedBy: admin.id
        });

        // Write History
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await RateHistory.create({
            type: 'region',
            before: null,
            after: newRegion,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        return NextResponse.json({ success: true, data: newRegion });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
