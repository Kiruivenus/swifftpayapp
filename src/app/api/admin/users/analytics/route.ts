import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import KycRequest from '@/models/KycRequest';
import Referral from '@/models/Referral';
import Transaction from '@/models/Transaction';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        await dbConnect();

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const prevWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // 1. Core user stats
        const totalUsers = await User.countDocuments({ role: 'user', isDeleted: false });
        const verifiedUsers = await User.countDocuments({ role: 'user', kycStatus: 'APPROVED', isDeleted: false });
        const pendingKycUsers = await User.countDocuments({ role: 'user', kycStatus: 'PENDING', isDeleted: false });
        const suspendedUsers = await User.countDocuments({ role: 'user', status: 'BLOCKED', isDeleted: false });

        // 2. Active users today (Sessions seen today or active status)
        const activeUsersToday = await Session.distinct('userId', {
            lastSeenAt: { $gte: startOfToday },
            status: 'active'
        }).then(res => res.length);

        // 3. New registrations (today & this week vs prev week)
        const newRegistrationsToday = await User.countDocuments({
            role: 'user',
            isDeleted: false,
            createdAt: { $gte: startOfToday }
        });

        const newRegistrationsThisWeek = await User.countDocuments({
            role: 'user',
            isDeleted: false,
            createdAt: { $gte: startOfWeek }
        });

        const newRegistrationsPrevWeek = await User.countDocuments({
            role: 'user',
            isDeleted: false,
            createdAt: { $gte: prevWeekStart, $lt: startOfWeek }
        });

        // Calculate growth rate for registrations
        let signupTrend = '+0.0%';
        if (newRegistrationsPrevWeek > 0) {
            const pct = ((newRegistrationsThisWeek - newRegistrationsPrevWeek) / newRegistrationsPrevWeek) * 100;
            signupTrend = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        } else if (newRegistrationsThisWeek > 0) {
            signupTrend = '+100.0%';
        }

        // 4. Referrals
        const totalReferrals = await Referral.countDocuments({});

        // 5. Total Financial volumes (Deposits / Withdrawals)
        const financeAgg = await Transaction.aggregate([
            { $match: { status: 'SUCCESS' } },
            {
                $group: {
                    _id: { type: '$type', currency: '$currency' },
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const getStats = (type: string, currency: string) =>
            financeAgg.find(s => s._id.type === type && s._id.currency === currency)?.total || 0;

        const totalDepositsKES = getStats('DEPOSIT', 'KES');
        const totalDepositsUSDT = getStats('DEPOSIT', 'USDT');
        const totalWithdrawalsKES = getStats('WITHDRAW', 'KES');
        const totalWithdrawalsUSDT = getStats('WITHDRAW', 'USDT');

        // Let's create comparative trends
        // User growth trend
        const prevTotalUsers = await User.countDocuments({
            role: 'user',
            isDeleted: false,
            createdAt: { $lt: startOfWeek }
        });
        let userTrend = '+0.0%';
        if (prevTotalUsers > 0) {
            const pct = ((totalUsers - prevTotalUsers) / prevTotalUsers) * 100;
            userTrend = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        }

        // Active users trend
        const activeUsersPrevWeek = await Session.distinct('userId', {
            lastSeenAt: { $gte: startOfWeek, $lt: startOfToday },
            status: 'active'
        }).then(res => res.length);
        let activeTrend = '+0.0%';
        if (activeUsersPrevWeek > 0) {
            const pct = ((activeUsersToday - (activeUsersPrevWeek / 7)) / (activeUsersPrevWeek / 7)) * 100;
            activeTrend = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
        }

        return NextResponse.json({
            success: true,
            analytics: {
                totalUsers,
                activeUsersToday,
                verifiedUsers,
                pendingKycUsers,
                suspendedUsers,
                newRegistrationsToday,
                newRegistrationsThisWeek,
                totalReferrals,
                financials: {
                    totalDepositsKES,
                    totalDepositsUSDT,
                    totalWithdrawalsKES,
                    totalWithdrawalsUSDT
                },
                trends: {
                    userTrend,
                    activeTrend,
                    signupTrend
                }
            }
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
