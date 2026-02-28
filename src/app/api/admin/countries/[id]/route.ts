import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Country from '@/models/Country';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        const body = await req.json();
        await dbConnect();

        const country = await Country.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true }
        );

        if (!country) return NextResponse.json({ message: 'Country not found' }, { status: 404 });

        // Audit log
        await logAdminAction(admin.id, 'UPDATE_COUNTRY', 'COUNTRY', params.id, `Updated country configuration for ${country.countryName}`);

        return NextResponse.json(country);

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        await dbConnect();
        const country = await Country.findByIdAndDelete(params.id);
        if (!country) return NextResponse.json({ message: 'Country not found' }, { status: 404 });

        // Audit log
        await logAdminAction(admin.id, 'DELETE_COUNTRY', 'COUNTRY', params.id, `Deleted country: ${country.countryName}`);

        return NextResponse.json({ success: true, message: 'Country deleted.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
