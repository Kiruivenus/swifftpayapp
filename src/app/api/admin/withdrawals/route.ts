import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.APPROVE_WITHDRAWALS);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const currency = searchParams.get('currency');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    try {
        await dbConnect();

        const query: any = { type: 'WITHDRAW', status: 'PENDING' };
        if (currency) query.currency = currency;

        const [withdrawals, total] = await Promise.all([
            Transaction.find(query)
                .populate('userId', 'username email fullName profilePhotoUrl')
                .sort({ createdAt: 1 }) // FIFO
                .skip(skip)
                .limit(limit),
            Transaction.countDocuments(query)
        ]);

        return NextResponse.json({
            withdrawals,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
