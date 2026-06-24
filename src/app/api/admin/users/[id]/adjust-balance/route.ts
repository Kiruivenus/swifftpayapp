import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import Transaction from '@/models/Transaction';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: userId } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        const { currency, amount, type, reason } = await req.json();

        if (!currency || !amount || !type || !reason) {
            return NextResponse.json({ message: 'Currency, amount, type (CREDIT/DEBIT), and reason are required.' }, { status: 400 });
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return NextResponse.json({ message: 'Amount must be a positive number.' }, { status: 400 });
        }

        if (currency !== 'KES' && currency !== 'USDT') {
            return NextResponse.json({ message: 'Supported currencies are KES and USDT.' }, { status: 400 });
        }

        if (type !== 'CREDIT' && type !== 'DEBIT') {
            return NextResponse.json({ message: 'Type must be CREDIT or DEBIT.' }, { status: 400 });
        }

        await dbConnect();
        
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ message: 'User not found.' }, { status: 404 });

        let wallet = await Wallet.findOne({ userId });
        if (!wallet) {
            // Create wallet if not exists
            wallet = await Wallet.create({
                userId,
                kesBalance: user.kesBalance || 0,
                usdtBalance: user.usdtBalance || 0
            });
        } else {
            // Sync wallet balances from user model
            wallet.kesBalance = user.kesBalance || 0;
            wallet.usdtBalance = user.usdtBalance || 0;
        }

        const balanceField = currency === 'KES' ? 'kesBalance' : 'usdtBalance';
        const lockedField = currency === 'KES' ? 'lockedKES' : 'lockedUSDT';

        // Check funds if debiting
        if (type === 'DEBIT') {
            const availableFunds = user[balanceField] - (wallet[lockedField] || 0);
            if (numericAmount > availableFunds) {
                return NextResponse.json({ message: `Insufficient available funds. Current: ${currency} ${availableFunds}` }, { status: 400 });
            }
        }

        // Apply ledger changes
        const adjustment = type === 'CREDIT' ? numericAmount : -numericAmount;
        
        user[balanceField] += adjustment;
        await user.save();

        wallet[balanceField] = user[balanceField];
        wallet.lastUpdated = new Date();
        await wallet.save();

        // Create transaction history document
        const transaction = await Transaction.create({
            userId,
            amount: numericAmount,
            currency,
            type: type === 'CREDIT' ? 'DEPOSIT' : 'WITHDRAW',
            status: 'SUCCESS',
            processedAt: new Date(),
            processedBy: admin.id,
            fee: 0,
            netAmount: numericAmount,
            checkoutRequestID: `MANUAL-${type}-${Date.now()}`
        });

        // Audit Log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: type === 'CREDIT' ? 'CREDIT_BALANCE' : 'DEBIT_BALANCE',
            targetType: 'USER',
            targetId: userId,
            details: {
                currency,
                amount: numericAmount,
                reason,
                txId: transaction._id
            },
            ipAddress: ip,
            userAgent: ua,
            severity: 'CRITICAL'
        });

        return NextResponse.json({
            success: true,
            message: `Wallet successfully ${type === 'CREDIT' ? 'credited' : 'debited'} by ${currency} ${numericAmount}`,
            newBalance: wallet[balanceField]
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
