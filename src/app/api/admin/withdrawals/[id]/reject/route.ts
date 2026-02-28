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
        const { reason } = await req.json();
        if (!reason) return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });

        await dbConnect();

        const tx = await Transaction.findById(id);
        if (!tx) return NextResponse.json({ message: 'Withdrawal request not found' }, { status: 404 });

        if (tx.type !== 'WITHDRAW' || tx.status !== 'PENDING') {
            return NextResponse.json({ message: `Invalid transaction status: ${tx.status}` }, { status: 400 });
        }

        // 1. Update Transaction
        tx.status = 'FAILED';
        tx.rejectionReason = reason;
        tx.processedAt = new Date();
        tx.processedBy = admin.id;
        await tx.save();

        // 2. Update Wallet (Move from locked back to available)
        let wallet = await Wallet.findOne({ userId: tx.userId });
        if (!wallet) {
            // Fallback: Re-add to User legacy balance
            const user = await User.findById(tx.userId);
            if (user) {
                if (tx.currency === 'KES') {
                    user.kesBalance += tx.amount;
                } else {
                    user.usdtBalance += tx.amount;
                }
                await user.save();
            }
        } else {
            if (tx.currency === 'KES') {
                wallet.lockedKES = Math.max(0, wallet.lockedKES - tx.amount);
                wallet.kesBalance += tx.amount;
            } else {
                wallet.lockedUSDT = Math.max(0, wallet.lockedUSDT - tx.amount);
                wallet.usdtBalance += tx.amount;
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

        return NextResponse.json({ success: true, message: 'Withdrawal rejected. Funds returned to user.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
