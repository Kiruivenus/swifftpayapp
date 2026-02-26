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

        // Calculate pending amounts for KES (only pending withdrawals)
        const pendingKES = await Transaction.aggregate([
            { $match: { userId: user.id, currency: 'KES', type: 'WITHDRAW', status: 'PENDING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmountKES = pendingKES.length > 0 ? pendingKES[0].total : 0;

        // Calculate pending amounts for USDT (only pending withdrawals)
        const pendingUSDT = await Transaction.aggregate([
            { $match: { userId: user.id, currency: 'USDT', type: 'WITHDRAW', status: 'PENDING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmountUSDT = pendingUSDT.length > 0 ? pendingUSDT[0].total : 0;

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
