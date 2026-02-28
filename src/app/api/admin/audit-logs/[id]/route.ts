import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AdminLog from '@/models/AdminLog';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        await dbConnect();
        const log = await AdminLog.findById(id);
        if (!log) return NextResponse.json({ message: 'Audit log not found' }, { status: 404 });

        return NextResponse.json(log);
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
