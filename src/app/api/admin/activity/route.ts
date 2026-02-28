import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import KycRequest from '@/models/KycRequest';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { subDays, format, startOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.VIEW_TRANSACTIONS);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'daily';

    try {
        await dbConnect();

        const days = range === 'weekly' ? 7 : range === 'monthly' ? 30 : 1;
        const labels: string[] = [];
        const registrationData: number[] = [];
        const transactionData: number[] = [];
        const kycData: number[] = [];

        // Generate time points
        for (let i = days - 1; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const label = format(date, 'MMM dd');
            labels.push(label);

            const start = startOfDay(date);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

            // Fetch counts for this window
            const regs = await User.countDocuments({ createdAt: { $gte: start, $lt: end } });
            const txs = await Transaction.countDocuments({ createdAt: { $gte: start, $lt: end }, status: 'SUCCESS' });
            const kycs = await KycRequest.countDocuments({ submittedAt: { $gte: start, $lt: end } });

            registrationData.push(regs);
            transactionData.push(txs);
            kycData.push(kycs);
        }

        return NextResponse.json({
            labels,
            datasets: [
                {
                    label: 'New Users',
                    data: registrationData,
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                },
                {
                    label: 'Transactions',
                    data: transactionData,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                },
                {
                    label: 'KYC Submissions',
                    data: kycData,
                    borderColor: 'rgb(168, 85, 247)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                }
            ]
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
