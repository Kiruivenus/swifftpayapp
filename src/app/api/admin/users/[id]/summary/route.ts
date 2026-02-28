import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import Session from '@/models/Session';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        await dbConnect();

        const [user, wallet, transactions, sessions] = await Promise.all([
            User.findById(id),
            Wallet.findOne({ userId: id }),
            Transaction.aggregate([
                { $match: { userId: id, status: 'SUCCESS' } },
                {
                    $group: {
                        _id: '$type',
                        total: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Session.countDocuments({ userId: id, status: 'active' })
        ]);

        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

        const stats = {
            totalDeposits: transactions.find(t => t._id === 'DEPOSIT')?.total || 0,
            totalWithdrawals: transactions.find(t => t._id === 'WITHDRAW')?.total || 0,
            totalTransfers: transactions.find(t => t._id === 'TRANSFER_SEND')?.total || 0,
            count: transactions.reduce((acc, curr) => acc + curr.count, 0)
        };

        return NextResponse.json({
            success: true,
            user,
            wallet,
            stats,
            activeSessions: sessions
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
