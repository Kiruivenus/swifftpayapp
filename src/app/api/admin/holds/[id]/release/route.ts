import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Wallet from '@/models/Wallet';
import BalanceHold from '@/models/BalanceHold';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.FREEZE_FUNDS);
    if (error) return error;

    const { id: holdId } = await params;

    try {
        const { reason } = await req.json();

        await dbConnect();

        const hold = await BalanceHold.findById(holdId);
        if (!hold) return NextResponse.json({ message: 'Hold not found' }, { status: 404 });
        if (hold.status === 'RELEASED') return NextResponse.json({ message: 'Hold already released' }, { status: 400 });

        const wallet = await Wallet.findOne({ userId: hold.userId });
        if (!wallet) return NextResponse.json({ message: 'Wallet not found' }, { status: 404 });

        // Update Wallet
        const lockedField = hold.currency === 'KES' ? 'lockedKES' : 'lockedUSDT';
        wallet[lockedField] = Math.max(0, wallet[lockedField] - hold.amount);
        wallet.lastUpdated = new Date();
        await wallet.save();

        // Update Hold
        hold.status = 'RELEASED';
        hold.releasedAt = new Date();
        hold.releaseReason = reason || 'Administrative release';
        hold.releasedByAdminId = admin.id;
        await hold.save();

        // Audit
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'RELEASE_FUNDS',
            targetType: 'HOLD',
            targetId: holdId,
            details: {
                userId: hold.userId,
                currency: hold.currency,
                amount: hold.amount,
                reason
            },
            severity: 'WARNING'
        });

        return NextResponse.json({ message: 'Funds released successfully', hold });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
