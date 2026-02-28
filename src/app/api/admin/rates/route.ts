import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Rate from '@/models/Rate';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.VIEW_TRANSACTIONS);
    if (error) return error;

    try {
        await dbConnect();
        const rates = await Rate.find().sort({ pair: 1 });
        return NextResponse.json(rates);
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const body = await req.json();
        const { pair, rate, spread, trend, percentChange, isEmergencyLocked } = body;

        await dbConnect();

        const updatedRate = await Rate.findOneAndUpdate(
            { pair },
            {
                $set: {
                    rate,
                    spread,
                    trend,
                    percentChange,
                    isEmergencyLocked,
                    updatedBy: admin.id,
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        // Audit log
        await logAdminAction(admin.id, 'UPDATE_RATE', 'RATE', updatedRate._id, `Updated ${pair} rate to ${rate} (Spread: ${spread})`);

        return NextResponse.json(updatedRate);

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
