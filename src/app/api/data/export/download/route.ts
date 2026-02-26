import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';
import User from '@/models/User';
import Transaction from '@/models/Transaction';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Fetch User Profile
        const dbUser = await User.findById(user.id).select('-password -pinHash');
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Fetch All Transactions
        const transactions = await Transaction.find({ userId: user.id }).sort({ createdAt: -1 });

        // Build the export data object
        const exportData = {
            exportedAt: new Date().toISOString(),
            profile: {
                id: dbUser._id,
                email: dbUser.email,
                username: dbUser.username,
                fullName: dbUser.fullName,
                phoneNumber: dbUser.phoneNumber,
                dob: dbUser.dob,
                kesBalance: dbUser.kesBalance,
                usdtBalance: dbUser.usdtBalance,
                role: dbUser.role,
                status: dbUser.status,
                createdAt: dbUser.createdAt,
                notificationPrefs: dbUser.notificationPrefs,
                userSettings: dbUser.userSettings
            },
            transactions: transactions.map(tx => ({
                id: tx._id,
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency,
                status: tx.status,
                recipientId: tx.recipientId,
                senderId: tx.senderId,
                fee: tx.fee,
                netAmount: tx.netAmount,
                createdAt: tx.createdAt,
                mpesaReceiptNumber: tx.mpesaReceiptNumber,
                network: tx.network,
                toAddress: tx.toAddress
            }))
        };

        // Return as JSON file attachment
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename=swiftpay_data_${dbUser.username || user.id}.json`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
