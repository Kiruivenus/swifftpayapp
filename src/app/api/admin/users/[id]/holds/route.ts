import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import BalanceHold from '@/models/BalanceHold';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

// POST /api/admin/users/[id]/holds -> Create Hold
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.FREEZE_FUNDS);
    if (error) return error;

    const userId = params.id;

    try {
        const { currency, amount, reason, referenceId } = await req.json();

        if (!currency || !amount || !reason) {
            return NextResponse.json({ message: 'Currency, amount, and reason are required' }, { status: 400 });
        }

        if (amount <= 0) {
            return NextResponse.json({ message: 'Amount must be greater than 0' }, { status: 400 });
        }

        await dbConnect();

        // 1. Check user & wallet
        const wallet = await Wallet.findOne({ userId });
        if (!wallet) return NextResponse.json({ message: 'Wallet not found' }, { status: 404 });

        // 2. Check available balance
        const balanceField = currency === 'KES' ? 'kesBalance' : 'usdtBalance';
        const lockedField = currency === 'KES' ? 'lockedKES' : 'lockedUSDT';

        const available = wallet[balanceField] - wallet[lockedField];
        if (amount > available) {
            return NextResponse.json({ message: 'Insufficient available balance to freeze' }, { status: 400 });
        }

        // 3. Create Hold
        const hold = await BalanceHold.create({
            userId,
            currency,
            amount,
            reason,
            referenceId,
            createdByAdminId: admin.id,
            status: 'ACTIVE'
        });

        // 4. Update Wallet Locked Balance
        wallet[lockedField] += amount;
        wallet.lastUpdated = new Date();
        await wallet.save();

        // 5. Audit
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.username,
            actorRole: admin.role,
            actionType: 'FREEZE_FUNDS',
            targetType: 'USER',
            targetId: userId,
            details: {
                currency,
                amount,
                reason,
                holdId: hold._id
            },
            severity: 'CRITICAL'
        });

        return NextResponse.json({ message: 'Funds frozen successfully', hold });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

// GET /api/admin/users/[id]/holds -> List Holds
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { error } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        await dbConnect();
        const holds = await BalanceHold.find({ userId: params.id }).sort({ createdAt: -1 });
        return NextResponse.json({ items: holds });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
