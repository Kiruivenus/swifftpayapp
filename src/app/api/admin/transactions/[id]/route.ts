import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import AdminLog from '@/models/AdminLog';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error } = await validateAdmin(req, PERMISSIONS.VIEW_TRANSACTIONS);
    if (error) return error;

    try {
        await dbConnect();

        const transaction = await Transaction.findById(id)
            .populate('userId', 'username email fullName phone profilePhotoUrl kycStatus')
            .populate('processedBy', 'name email');

        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Fetch related audit logs
        const auditLogs = await AdminLog.find({
            targetType: 'TRANSACTION',
            targetId: id
        }).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            transaction,
            auditLogs
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
