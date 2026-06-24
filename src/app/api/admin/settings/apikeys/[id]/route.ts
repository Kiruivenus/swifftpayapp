import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { error } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        const { id } = await context.params;
        const body = await req.json();
        const { action } = body;

        await dbConnect();
        const keyRecord = await ApiKey.findById(id);

        if (!keyRecord) {
            return NextResponse.json({ success: false, message: 'API key not found.' }, { status: 404 });
        }

        if (action === 'REVOKE') {
            keyRecord.status = 'REVOKED';
            await keyRecord.save();
            return NextResponse.json({ success: true, message: 'API key revoked successfully.', data: keyRecord });
        } else if (action === 'REGENERATE') {
            const buffer = require('crypto').randomBytes(24);
            const secret = buffer.toString('hex');
            const prefix = 'sk_live_';
            const fullKey = `${prefix}${secret}`;

            keyRecord.key = fullKey;
            keyRecord.status = 'ACTIVE';
            await keyRecord.save();

            return NextResponse.json({
                success: true,
                message: 'API key regenerated successfully.',
                data: keyRecord,
                fullKey
            });
        }

        return NextResponse.json({ success: false, message: 'Invalid action specified.' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { error } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        const { id } = await context.params;

        await dbConnect();
        const deleted = await ApiKey.findByIdAndDelete(id);

        if (!deleted) {
            return NextResponse.json({ success: false, message: 'API key not found.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'API key deleted permanently.' });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
