import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.APPROVE_WITHDRAWALS);
    if (error) return error;

    try {
        await dbConnect();

        const tx = await Transaction.findById(id);
        if (!tx) {
            return NextResponse.json({ message: 'Withdrawal request not found.' }, { status: 404 });
        }

        if (tx.type !== 'WITHDRAW' || tx.status !== 'PENDING') {
            return NextResponse.json({
                message: `This withdrawal cannot be approved. Current status: ${tx.status}`
            }, { status: 400 });
        }

        // 1. Find the user and verify they have sufficient balance
        const user = await User.findById(tx.userId);
        if (!user) {
            return NextResponse.json({ message: 'User account not found.' }, { status: 404 });
        }

        const balanceField = tx.currency === 'KES' ? 'kesBalance' : 'usdtBalance';
        if (user[balanceField] < tx.amount) {
            return NextResponse.json({
                message: `User has insufficient ${tx.currency} balance. Current: ${user[balanceField]}, Required: ${tx.amount}`
            }, { status: 400 });
        }

        // 2. Deduct the withdrawal amount from the user's balance
        user[balanceField] = Math.max(0, user[balanceField] - tx.amount);
        await user.save();

        // 3. Update Transaction status to SUCCESS
        tx.status = 'SUCCESS';
        tx.processedAt = new Date();
        tx.processedBy = admin.id;
        await tx.save();

        // 4. Notify the user
        await sendNotification(
            tx.userId,
            'Withdrawal Approved',
            `Your withdrawal of ${tx.netAmount || tx.amount} ${tx.currency} has been approved and processed.`,
            'FINANCE'
        );

        // 5. Audit log
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
                fee: tx.fee,
                netAmount: tx.netAmount,
                currency: tx.currency,
                userId: tx.userId,
                previousBalance: user[balanceField] + tx.amount,
                newBalance: user[balanceField]
            },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({
            success: true,
            message: `Withdrawal of ${tx.amount} ${tx.currency} approved. User balance updated.`
        });

    } catch (err: any) {
        console.error('Approve withdrawal error:', err);
        return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
