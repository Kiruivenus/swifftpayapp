import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import ApiKey from '@/models/ApiKey';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        await dbConnect();
        const keys = await ApiKey.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, keys });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        const body = await req.json();
        const { name, rateLimit = 120 } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: 'API key name is required.' }, { status: 400 });
        }

        const buffer = require('crypto').randomBytes(24);
        const secret = buffer.toString('hex');
        const prefix = 'sk_live_';
        const fullKey = `${prefix}${secret}`;

        await dbConnect();
        const keyRecord = await ApiKey.create({
            name,
            key: fullKey,
            secretPrefix: prefix,
            rateLimit
        });

        return NextResponse.json({
            success: true,
            data: keyRecord,
            fullKey
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
