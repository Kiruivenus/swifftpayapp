import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import Referral from '@/models/Referral';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const kycStatus = searchParams.get('kycStatus');
    const country = searchParams.get('country');
    
    // Ranges
    const depositMin = searchParams.get('depositMin');
    const depositMax = searchParams.get('depositMax');
    const withdrawMin = searchParams.get('withdrawMin');
    const withdrawMax = searchParams.get('withdrawMax');
    const referralCountMin = searchParams.get('referralCountMin');
    const referralCountMax = searchParams.get('referralCountMax');
    
    // Dates
    const regDateStart = searchParams.get('regDateStart');
    const regDateEnd = searchParams.get('regDateEnd');

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    try {
        await dbConnect();

        const query: any = { role: { $ne: 'super_admin' } };

        // 1. Advanced Search Scan
        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { email: searchRegex },
                { emailNormalized: searchRegex },
                { username: searchRegex },
                { usernameNormalized: searchRegex },
                { phoneE164: { $regex: search.trim() } },
                { fullName: searchRegex },
                { referralCode: searchRegex },
                { usdtAddress: searchRegex }
            ];

            // If valid ID (Check for User ID or Transaction ID)
            if (search.trim().match(/^[0-9a-fA-F]{24}$/)) {
                query.$or.push({ _id: search.trim() });
                
                // Also search if it is a transaction ID, find the owner
                const tx = await Transaction.findById(search.trim());
                if (tx && tx.userId) {
                    query.$or.push({ _id: tx.userId });
                }
            }
        }

        // 2. Advanced Filters
        if (status) query.status = status;
        if (role) query.role = role.toLowerCase();
        if (kycStatus) query.kycStatus = kycStatus;
        if (country) query.countryCode = country.toUpperCase();

        // Registration Date Range
        if (regDateStart || regDateEnd) {
            query.createdAt = {};
            if (regDateStart) query.createdAt.$gte = new Date(regDateStart);
            if (regDateEnd) query.createdAt.$lte = new Date(regDateEnd);
        }

        // Financial volume filters (Deposit/Withdrawal sums)
        if (depositMin || depositMax || withdrawMin || withdrawMax) {
            const matchStage: any = { status: 'SUCCESS' };
            const financeAgg = await Transaction.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: { userId: '$userId', type: '$type' },
                        total: { $sum: '$amount' }
                    }
                }
            ]);

            const userFinanceMap: Record<string, { deposits: number; withdrawals: number }> = {};
            financeAgg.forEach(item => {
                const uid = item._id.userId;
                if (!userFinanceMap[uid]) {
                    userFinanceMap[uid] = { deposits: 0, withdrawals: 0 };
                }
                if (item._id.type === 'DEPOSIT') {
                    userFinanceMap[uid].deposits = item.total;
                } else if (item._id.type === 'WITHDRAW') {
                    userFinanceMap[uid].withdrawals = item.total;
                }
            });

            const matchingUserIds = Object.keys(userFinanceMap).filter(uid => {
                const f = userFinanceMap[uid];
                if (depositMin && f.deposits < parseFloat(depositMin)) return false;
                if (depositMax && f.deposits > parseFloat(depositMax)) return false;
                if (withdrawMin && f.withdrawals < parseFloat(withdrawMin)) return false;
                if (withdrawMax && f.withdrawals > parseFloat(withdrawMax)) return false;
                return true;
            });

            query._id = { $in: matchingUserIds };
        }

        // Referral count filter
        if (referralCountMin || referralCountMax) {
            const referralAgg = await Referral.aggregate([
                {
                    $group: {
                        _id: '$referrerId',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const matchingReferrerIds = referralAgg
                .filter(item => {
                    if (referralCountMin && item.count < parseInt(referralCountMin)) return false;
                    if (referralCountMax && item.count > parseInt(referralCountMax)) return false;
                    return true;
                })
                .map(item => item._id);

            // Merge with existing _id query if present
            if (query._id) {
                const existingIn = query._id.$in || [];
                query._id = { $in: existingIn.filter((id: string) => matchingReferrerIds.includes(id)) };
            } else {
                query._id = { $in: matchingReferrerIds };
            }
        }

        const [users, total] = await Promise.all([
            User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            User.countDocuments(query)
        ]);

        return NextResponse.json({
            users,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
