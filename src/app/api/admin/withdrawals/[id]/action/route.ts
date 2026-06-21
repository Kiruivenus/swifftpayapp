import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.APPROVE_WITHDRAWALS);
    if (error) return error;

    try {
        const body = await req.json();
        const { action, reason = '' } = body;

        if (!action || !['APPROVE', 'REJECT', 'HOLD', 'ESCALATE', 'REVERSE'].includes(action)) {
            return NextResponse.json({ message: 'Invalid action. Supported: APPROVE, REJECT, HOLD, ESCALATE, REVERSE' }, { status: 400 });
        }

        await dbConnect();

        const tx = await Transaction.findById(id);
        if (!tx) {
            return NextResponse.json({ message: 'Withdrawal request not found.' }, { status: 404 });
        }

        if (tx.type !== 'WITHDRAW') {
            return NextResponse.json({ message: 'This transaction is not a withdrawal.' }, { status: 400 });
        }

        const user = await User.findById(tx.userId);
        if (!user) {
            return NextResponse.json({ message: 'User account not found.' }, { status: 404 });
        }

        const balanceField = tx.currency === 'KES' ? 'kesBalance' : 'usdtBalance';
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        // Operational Workflows
        if (action === 'APPROVE') {
            if (tx.status !== 'PENDING' && tx.status !== 'HOLD' && tx.status !== 'ESCALATED') {
                return NextResponse.json({ message: `Cannot approve. Status is ${tx.status}` }, { status: 400 });
            }

            if (user[balanceField] < tx.amount) {
                return NextResponse.json({
                    message: `User has insufficient balance. Current: ${user[balanceField]} ${tx.currency}, Required: ${tx.amount} ${tx.currency}`
                }, { status: 400 });
            }

            // Deduct from balance (available balance was already reduced by pending hold)
            user[balanceField] = Math.max(0, user[balanceField] - tx.amount);
            await user.save();

            tx.status = 'SUCCESS';
            tx.processedAt = new Date();
            tx.processedBy = admin.id;
            await tx.save();

            // Notify user
            await sendNotification(
                tx.userId,
                'Withdrawal Approved',
                `Your withdrawal of ${tx.netAmount || tx.amount} ${tx.currency} has been approved and processed.`,
                'FINANCE'
            );

            // Audit
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
                    newBalance: user[balanceField],
                    reason
                },
                ipAddress: ip,
                userAgent: ua,
                severity: 'INFO'
            });

            return NextResponse.json({ success: true, message: 'Withdrawal approved successfully' });

        } else if (action === 'REJECT') {
            if (tx.status !== 'PENDING' && tx.status !== 'HOLD' && tx.status !== 'ESCALATED') {
                return NextResponse.json({ message: `Cannot reject. Status is ${tx.status}` }, { status: 400 });
            }

            if (!reason) {
                return NextResponse.json({ message: 'A rejection reason is required.' }, { status: 400 });
            }

            tx.status = 'FAILED';
            tx.rejectionReason = reason;
            tx.processedAt = new Date();
            tx.processedBy = admin.id;
            await tx.save();

            // Notify user
            await sendNotification(
                tx.userId,
                'Withdrawal Rejected',
                `Your withdrawal of ${tx.amount} ${tx.currency} was rejected. Reason: ${reason}.`,
                'FINANCE'
            );

            // Audit
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
                    reason
                },
                ipAddress: ip,
                userAgent: ua,
                severity: 'WARNING'
            });

            return NextResponse.json({ success: true, message: 'Withdrawal rejected. Pending hold released.' });

        } else if (action === 'HOLD') {
            if (tx.status !== 'PENDING' && tx.status !== 'ESCALATED') {
                return NextResponse.json({ message: `Cannot place on hold. Status is ${tx.status}` }, { status: 400 });
            }

            if (!reason) {
                return NextResponse.json({ message: 'A reason is required to place a hold.' }, { status: 400 });
            }

            tx.status = 'HOLD';
            tx.flagReason = reason; // Reuse flagReason to store hold reason
            await tx.save();

            // Notify user
            await sendNotification(
                tx.userId,
                'Withdrawal Delayed',
                `Your withdrawal of ${tx.amount} ${tx.currency} has been put on temporary hold for review.`,
                'FINANCE'
            );

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'HOLD_WITHDRAWAL',
                targetType: 'TRANSACTION',
                targetId: id,
                details: {
                    amount: tx.amount,
                    currency: tx.currency,
                    reason
                },
                ipAddress: ip,
                userAgent: ua,
                severity: 'WARNING'
            });

            return NextResponse.json({ success: true, message: 'Withdrawal placed on hold.' });

        } else if (action === 'ESCALATE') {
            if (tx.status !== 'PENDING' && tx.status !== 'HOLD') {
                return NextResponse.json({ message: `Cannot escalate. Status is ${tx.status}` }, { status: 400 });
            }

            if (!reason) {
                return NextResponse.json({ message: 'An escalation reason is required.' }, { status: 400 });
            }

            tx.status = 'ESCALATED';
            tx.flagReason = reason; // Reuse flagReason to store escalation reason
            await tx.save();

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'ESCALATE_WITHDRAWAL',
                targetType: 'TRANSACTION',
                targetId: id,
                details: {
                    amount: tx.amount,
                    currency: tx.currency,
                    reason
                },
                ipAddress: ip,
                userAgent: ua,
                severity: 'WARNING'
            });

            return NextResponse.json({ success: true, message: 'Withdrawal escalated to compliance team.' });

        } else if (action === 'REVERSE') {
            if (tx.status !== 'SUCCESS') {
                return NextResponse.json({ message: `Only successful withdrawals can be reversed. Current: ${tx.status}` }, { status: 400 });
            }

            if (!reason) {
                return NextResponse.json({ message: 'A reason is required to reverse an approved withdrawal.' }, { status: 400 });
            }

            // Refund user's balance
            const refundAmount = tx.amount; // includes netAmount + fee
            user[balanceField] = (user[balanceField] || 0) + refundAmount;
            await user.save();

            // Set transaction status to REVERSED
            tx.status = 'REVERSED';
            tx.rejectionReason = `Reversed by administrator. Reason: ${reason}`;
            tx.processedAt = new Date();
            tx.processedBy = admin.id;
            await tx.save();

            // Notify user
            await sendNotification(
                tx.userId,
                'Withdrawal Reversed',
                `Your withdrawal of ${tx.amount} ${tx.currency} has been reversed. ${tx.amount} ${tx.currency} was refunded to your wallet.`,
                'FINANCE'
            );

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'REVERSE_WITHDRAWAL',
                targetType: 'TRANSACTION',
                targetId: id,
                details: {
                    amount: tx.amount,
                    currency: tx.currency,
                    newBalance: user[balanceField],
                    reason
                },
                ipAddress: ip,
                userAgent: ua,
                severity: 'CRITICAL'
            });

            return NextResponse.json({ success: true, message: 'Withdrawal reversed. Balance refunded to user.' });
        }

    } catch (err: any) {
        console.error('Withdrawal action error:', err);
        return NextResponse.json({ message: err.message || 'Something went wrong.' }, { status: 500 });
    }
}
