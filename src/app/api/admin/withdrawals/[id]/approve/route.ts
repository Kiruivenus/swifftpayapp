import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.APPROVE_WITHDRAWALS);
    if (error) return error;

    try {
        await dbConnect();

        const tx = await Transaction.findById(id);
        if (!tx) return NextResponse.json({ message: 'Withdrawal request not found' }, { status: 404 });

        if (tx.type !== 'WITHDRAW' || tx.status !== 'PENDING') {
            return NextResponse.json({ message: `Invalid transaction status: ${tx.status}` }, { status: 400 });
        }

        // 1. Update Transaction
        tx.status = 'SUCCESS';
        tx.processedAt = new Date();
        tx.processedBy = admin.id;
        await tx.save();

        // 2. Update Wallet (Deduct from locked)
        // Ensure wallet exists
        let wallet = await Wallet.findOne({ userId: tx.userId });
        if (!wallet) {
            // Fallback to User legacy balance if wallet doesn't exist yet
            const user = await User.findById(tx.userId);
            if (user) {
                // If we're using legacy, the amount should remain deducted from kesBalance
                // No action needed here if it was already deducted on request
            }
        } else {
            if (tx.currency === 'KES') {
                wallet.lockedKES = Math.max(0, wallet.lockedKES - tx.amount);
            } else {
                wallet.lockedUSDT = Math.max(0, wallet.lockedUSDT - tx.amount);
            }
            wallet.lastUpdated = new Date();
            await wallet.save();
        }

        // Audit log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'APPROVE_WITHDRAWAL',
            targetType: 'TRANSACTION',
            targetId: id,
            details: {
                amount: tx.amount,
                currency: tx.currency,
                userId: tx.userId
            },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, message: 'Withdrawal approved successfully.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
