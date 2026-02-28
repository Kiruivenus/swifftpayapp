import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import Session from '@/models/Session';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.VIEW_TRANSACTIONS);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    try {
        await dbConnect();

        // 1. Define time range (default 30 days)
        const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const dateTo = to ? new Date(to) : new Date();

        const query: any = {
            status: 'SUCCESS',
            createdAt: { $gte: dateFrom, $lte: dateTo }
        };

        // 2. Metrics Aggregation
        const metrics = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { type: '$type', currency: '$currency' },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const findTotal = (type: string, currency: string) =>
            metrics.find(m => m._id.type === type && m._id.currency === currency)?.total || 0;

        // 3. Simple stats for summary cards
        const depositKES = findTotal('DEPOSIT', 'KES');
        const transferReceiveKES = findTotal('TRANSFER_RECEIVE', 'KES'); // Also an inflow? 
        const withdrawKES = findTotal('WITHDRAW', 'KES');

        // 4. Active Sessions
        const activeSessions = await Session.countDocuments({ status: 'active' });

        return NextResponse.json({
            success: true,
            totalDepositsKES: depositKES,
            totalWithdrawalsKES: withdrawKES,
            activeSessions,
            range: { from: dateFrom, to: dateTo },
            raw: metrics
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
