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

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

        // 1. User Stats (Case-insensitive role match)
        const userQuery = { role: { $in: ['user', 'USER'] } };
        const totalUsers = await User.countDocuments(userQuery);
        const verifiedUsers = await User.countDocuments({ ...userQuery, kycStatus: 'APPROVED' });

        // User Deltas (Growth over last 30 days)
        const usersPrev = await User.countDocuments({ ...userQuery, createdAt: { $lt: thirtyDaysAgo } });
        const kycPrev = await User.countDocuments({ ...userQuery, kycStatus: 'APPROVED', updatedAt: { $lt: thirtyDaysAgo } });

        const calculateDelta = (curr: number, prev: number) => {
            if (prev === 0) return curr > 0 ? `+${(curr * 100).toFixed(1)}%` : "0.0%";
            const diff = ((curr - prev) / prev) * 100;
            return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
        };

        // 2. KYC Stats
        const pendingKyc = await KycRequest.countDocuments({ status: 'PENDING' });

        // 3. Finance Stats
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

        // Finance Deltas
        const financeDeltas = await Transaction.aggregate([
            {
                $match: {
                    status: 'SUCCESS',
                    createdAt: { $gt: sixtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        period: {
                            $cond: [{ $gt: ['$createdAt', thirtyDaysAgo] }, 'current', 'previous']
                        }
                    },
                    deposits: {
                        $sum: { $cond: [{ $eq: ['$type', 'DEPOSIT'] }, '$amount', 0] }
                    },
                    withdrawals: {
                        $sum: { $cond: [{ $eq: ['$type', 'WITHDRAW'] }, '$amount', 0] }
                    }
                }
            }
        ]);

        const currentFinance = financeDeltas.find(d => d._id.period === 'current') || { deposits: 0, withdrawals: 0 };
        const previousFinance = financeDeltas.find(d => d._id.period === 'previous') || { deposits: 0, withdrawals: 0 };

        // 4. Session Stats (Standardize on isActive or status: 'active')
        const activeSessions = await Session.countDocuments({
            $or: [
                { status: 'active' },
                { isActive: true }
            ],
            expiresAt: { $gt: now }
        });

        // 5. Deltas
        const deltas = {
            users: calculateDelta(totalUsers, usersPrev),
            deposits: calculateDelta(currentFinance.deposits, previousFinance.deposits),
            kyc: calculateDelta(verifiedUsers, kycPrev),
            volume: calculateDelta(currentFinance.withdrawals, previousFinance.withdrawals)
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
