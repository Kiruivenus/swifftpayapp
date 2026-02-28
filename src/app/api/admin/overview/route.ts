import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import KycRequest from '@/models/KycRequest';
import Session from '@/models/Session';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error, user } = await validateAdmin(req, PERMISSIONS.VIEW_TRANSACTIONS);
    if (error) return error;

    try {
        await dbConnect();

        // 1. User Stats
        const totalUsers = await User.countDocuments({ role: 'user' });
        const verifiedUsers = await User.countDocuments({ role: 'user', kycStatus: 'APPROVED' });

        // 2. KYC Stats
        const pendingKyc = await KycRequest.countDocuments({ status: 'PENDING' });

        // 3. Finance Stats (Aggregated from Transactions)
        // Note: For production, we'd use pre-computed stats or a more efficient aggregation
        const financeStats = await Transaction.aggregate([
            { $match: { status: 'SUCCESS' } },
            {
                $group: {
                    _id: { type: '$type', currency: '$currency' },
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const getStats = (type: string, currency: string) =>
            financeStats.find(s => s._id.type === type && s._id.currency === currency)?.total || 0;

        // 4. Session Stats
        const activeSessions = await Session.countDocuments({ isActive: true });

        // 5. Deltas (Simplified for now - would compare with previous period)
        const deltas = {
            users: "+12.5%",
            deposits: "+8.2%",
            kyc: "-2.4%",
            volume: "+15.1%"
        };

        return NextResponse.json({
            totalUsers,
            verifiedUsers,
            pendingKyc,
            activeSessions,
            finance: {
                totalDepositsKES: getStats('DEPOSIT', 'KES'),
                totalWithdrawalsKES: getStats('WITHDRAW', 'KES'),
                totalDepositsUSDT: getStats('DEPOSIT', 'USDT'),
                totalWithdrawalsUSDT: getStats('WITHDRAW', 'USDT'),
            },
            deltas
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
