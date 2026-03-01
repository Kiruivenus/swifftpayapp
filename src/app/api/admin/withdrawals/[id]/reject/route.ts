import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.APPROVE_WITHDRAWALS);
    if (error) return error;

    try {
        const { reason } = await req.json();
        if (!reason) {
            return NextResponse.json({ message: 'Please provide a reason for rejection.' }, { status: 400 });
        }

        await dbConnect();

        const tx = await Transaction.findById(id);
        if (!tx) {
            return NextResponse.json({ message: 'Withdrawal request not found.' }, { status: 404 });
        }

        if (tx.type !== 'WITHDRAW' || tx.status !== 'PENDING') {
            return NextResponse.json({
                message: `This withdrawal cannot be rejected. Current status: ${tx.status}`
            }, { status: 400 });
        }

        // Mark transaction as FAILED — this automatically "releases" the pending hold
        // because the balance API only subtracts PENDING withdrawals from available balance.
        // No balance adjustment needed since the amount was never actually deducted.
        tx.status = 'FAILED';
        tx.rejectionReason = reason;
        tx.processedAt = new Date();
        tx.processedBy = admin.id;
        await tx.save();

        // Notify the user
        await sendNotification(
            tx.userId,
            'Withdrawal Rejected',
            `Your withdrawal of ${tx.amount} ${tx.currency} was rejected. Reason: ${reason}. The funds are available in your account.`,
            'FINANCE'
        );

        // Audit log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'REJECT_WITHDRAWAL',
            targetType: 'TRANSACTION',
            targetId: id,
            details: {
                amount: tx.amount,
                currency: tx.currency,
                userId: tx.userId,
                reason
            },
            ipAddress: ip,
            userAgent: ua,
            severity: 'WARNING'
        });

        return NextResponse.json({
            success: true,
            message: 'Withdrawal rejected. Pending hold has been released.'
        });

    } catch (err: any) {
        console.error('Reject withdrawal error:', err);
        return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
