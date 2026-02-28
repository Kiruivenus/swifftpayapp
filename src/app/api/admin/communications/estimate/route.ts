import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { resolveAudienceFilter } from '@/lib/audience';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function POST(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        const body = await req.json();
        const { targetAudience } = body;

        if (!targetAudience || !targetAudience.scope) {
            return NextResponse.json({ success: false, message: 'Invalid target audience' }, { status: 400 });
        }

        await dbConnect();
        const query = await resolveAudienceFilter(targetAudience);
        const count = await User.countDocuments(query);

        return NextResponse.json({ success: true, data: { targeted: count } });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
