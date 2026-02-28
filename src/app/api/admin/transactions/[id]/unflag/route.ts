import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.FLAG_TRANSACTIONS);
    if (error) return error;

    const { id: txId } = await params;

    try {
        const { reason } = await req.json();

        await dbConnect();

        const tx = await Transaction.findById(txId);
        if (!tx) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });

        if (!tx.isFlagged) {
            return NextResponse.json({ message: 'Transaction is not flagged' }, { status: 400 });
        }

        // Update Transaction
        tx.isFlagged = false;
        tx.flagReason = undefined;
        await tx.save();

        // Audit
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.username,
            actorRole: admin.role,
            actionType: 'UNFLAG_TRANSACTION',
            targetType: 'TRANSACTION',
            targetId: txId,
            details: {
                reason: reason || 'Administrative clearance'
            },
            severity: 'INFO'
        });

        return NextResponse.json({ message: 'Transaction unflagged successfully', tx });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
