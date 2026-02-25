import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Calculate pending withdrawals for KES
        const pendingWithdrawalsKES = await Transaction.aggregate([
            { $match: { userId: user.id, type: 'WITHDRAW', currency: 'KES', status: 'PENDING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmountKES = pendingWithdrawalsKES.length > 0 ? pendingWithdrawalsKES[0].total : 0;

        // Calculate pending withdrawals for USDT
        const pendingWithdrawalsUSDT = await Transaction.aggregate([
            { $match: { userId: user.id, type: 'WITHDRAW', currency: 'USDT', status: 'PENDING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmountUSDT = pendingWithdrawalsUSDT.length > 0 ? pendingWithdrawalsUSDT[0].total : 0;

        return NextResponse.json({
            kesBalance: dbUser.kesBalance,
            availableKesBalance: dbUser.kesBalance - pendingAmountKES,
            usdtBalance: dbUser.usdtBalance,
            availableUsdtBalance: dbUser.usdtBalance - pendingAmountUSDT,
            totalBalanceKES: dbUser.kesBalance + (dbUser.usdtBalance * 128.5), // Fixed rate for now
            currency: 'KES'
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
