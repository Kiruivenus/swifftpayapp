import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.APPROVE_WITHDRAWALS);
    if (error) return error;

    try {
        const { reason } = await req.json();
        if (!reason) return NextResponse.json({ message: 'Reason for failure is required' }, { status: 400 });

        await dbConnect();

        const tx = await Transaction.findById(id);
        if (!tx) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });

        if (tx.status !== 'PENDING' && tx.status !== 'UNDER_REVIEW') {
            return NextResponse.json({ message: `Cannot mark ${tx.status} transaction as failed` }, { status: 400 });
        }

        tx.status = 'FAILED';
        tx.rejectionReason = reason;
        tx.processedAt = new Date();
        tx.processedBy = admin.id;
        await tx.save();

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'FAIL_TRANSACTION',
            targetType: 'TRANSACTION',
            targetId: id,
            details: { reason, previousStatus: tx.status },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown',
            severity: 'WARNING'
        });

        return NextResponse.json({ success: true, message: 'Transaction marked as failed.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
