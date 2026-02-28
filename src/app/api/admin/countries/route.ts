import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Country from '@/models/Country';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        await dbConnect();
        const countries = await Country.find().sort({ countryName: 1 });
        return NextResponse.json(countries);
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        const body = await req.json();
        await dbConnect();

        const country = await Country.create({
            ...body,
            createdAt: new Date()
        });

        // Audit log
        await logAdminAction(admin.id, 'ADD_COUNTRY', 'COUNTRY', country._id, `Added new country: ${country.countryName} (${country.countryCode})`);

        return NextResponse.json(country);

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
