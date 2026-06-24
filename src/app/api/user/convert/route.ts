import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import CurrencyPair from '@/models/CurrencyPair';
import ExchangeRate from '@/models/ExchangeRate';
import ExchangeFee from '@/models/ExchangeFee';
import ExchangeLimit from '@/models/ExchangeLimit';
import ExchangeTransaction from '@/models/ExchangeTransaction';
import ConversionControl from '@/models/ConversionControl';
import { verifyAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // 1. Check Global Conversion Freeze
        const control = await (ConversionControl as any).getSettings();
        if (control.conversionsFrozen) {
            return NextResponse.json({
                success: false,
                code: 'CONVERSIONS_FROZEN',
                message: control.freezeReason || 'Conversions are temporarily unavailable.'
            }, { status: 503 });
        }

        const { amount, fromCurrency, toCurrency: bodyToCurrency } = await req.json();

        if (!fromCurrency) {
            return NextResponse.json({ message: 'Source currency is required.' }, { status: 400 });
        }

        if (!amount || amount <= 0) {
            return NextResponse.json({ message: 'Amount must be greater than zero' }, { status: 400 });
        }

        const from = fromCurrency.toUpperCase();
        const to = (bodyToCurrency || (from === 'USDT' ? 'KES' : 'USDT')).toUpperCase();

        // 2. Validate Pair Availability
        const pair = await CurrencyPair.findOne({ fromCurrency: from, toCurrency: to, isActive: true }).session(session);
        if (!pair) {
            return NextResponse.json({ message: `Exchange pair ${from}/${to} is not available.` }, { status: 400 });
        }

        // 3. Fetch Exchange Rate
        const rateObj = await ExchangeRate.findOne({ fromCurrency: from, toCurrency: to, isActive: true }).session(session);
        if (!rateObj) {
            return NextResponse.json({ message: `Exchange rate not found for ${from}/${to}.` }, { status: 400 });
        }
        const rate = rateObj.rate;

        // 4. Fetch Fees
        const feeObj = await ExchangeFee.findOne({ fromCurrency: from, toCurrency: to }).session(session);
        const exchangeFeePercent = feeObj ? feeObj.exchangeFeePercent : 0;
        const exchangeFeeFlat = feeObj ? feeObj.exchangeFeeFlat : 0;
        const networkFee = feeObj ? feeObj.networkFee : 0;

        // Calculate Fee
        const exchangeFee = (amount * exchangeFeePercent / 100) + exchangeFeeFlat;
        const totalFees = exchangeFee + networkFee;

        if (totalFees >= amount) {
            return NextResponse.json({ message: 'Transaction amount is too small to cover fees.' }, { status: 400 });
        }

        const netPay = amount - totalFees;
        const toAmount = netPay * rate;

        // 5. Fetch Limits
        const limitObj = await ExchangeLimit.findOne({ currency: from }).session(session);
        const minLimit = limitObj ? limitObj.minLimit : 0;
        const maxLimit = limitObj ? limitObj.maxLimit : 1000000;
        const dailyLimit = limitObj ? limitObj.dailyLimit : 5000000;

        if (amount < minLimit) {
            return NextResponse.json({ message: `Minimum exchange amount is ${minLimit} ${from}.` }, { status: 400 });
        }

        if (amount > maxLimit) {
            return NextResponse.json({ message: `Maximum exchange amount is ${maxLimit} ${from}.` }, { status: 400 });
        }

        // Check Daily Limits
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const todayExchanges = await ExchangeTransaction.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(user.id),
                    fromCurrency: from,
                    status: 'SUCCESS',
                    createdAt: { $gte: startOfDay }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$fromAmount' }
                }
            }
        ]).session(session);

        const todayTotal = todayExchanges.length > 0 ? todayExchanges[0].total : 0;
        if (todayTotal + amount > dailyLimit) {
            return NextResponse.json({ message: `Daily exchange limit of ${dailyLimit} ${from} reached. Today's total: ${todayTotal} ${from}.` }, { status: 400 });
        }

        // 6. Check Available Balance
        const dbUser = await User.findById(user.id).session(session);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Calculate pending withdrawals for balance validation
        const pendingWithdrawals = await Transaction.aggregate([
            { $match: { userId: user.id, type: 'WITHDRAW', currency: from, status: 'PENDING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).session(session);
        const pendingAmount = pendingWithdrawals.length > 0 ? pendingWithdrawals[0].total : 0;

        // Retrieve sender balance
        let balance = 0;
        if (from === 'KES') {
            balance = dbUser.kesBalance || 0;
        } else if (from === 'USDT') {
            balance = dbUser.usdtBalance || 0;
        } else {
            balance = (dbUser.balances && dbUser.balances.get(from)) || 0;
        }

        const availableBalance = balance - pendingAmount;
        if (availableBalance < amount) {
            return NextResponse.json({
                message: `Insufficient available ${from} balance. Available: ${availableBalance.toFixed(2)} ${from}.`
            }, { status: 400 });
        }

        // 7. Adjust Balances
        if (from === 'KES') {
            dbUser.kesBalance = Math.max(0, dbUser.kesBalance - amount);
        } else if (from === 'USDT') {
            dbUser.usdtBalance = Math.max(0, dbUser.usdtBalance - amount);
        } else {
            const curBal = dbUser.balances.get(from) || 0;
            dbUser.balances.set(from, Math.max(0, curBal - amount));
        }

        if (to === 'KES') {
            dbUser.kesBalance = (dbUser.kesBalance || 0) + toAmount;
        } else if (to === 'USDT') {
            dbUser.usdtBalance = (dbUser.usdtBalance || 0) + toAmount;
        } else {
            if (!dbUser.balances) dbUser.balances = new Map();
            const curBal = dbUser.balances.get(to) || 0;
            dbUser.balances.set(to, curBal + toAmount);
        }

        await dbUser.save({ session });

        // Generate Receipts
        const referenceId = `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const txId = `TX-EX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        // Create ExchangeTransaction
        const [exchangeTx] = await ExchangeTransaction.create([{
            userId: user.id,
            fromCurrency: from,
            toCurrency: to,
            fromAmount: amount,
            toAmount: toAmount,
            rate,
            exchangeFee,
            networkFee,
            status: 'SUCCESS',
            referenceId,
            txId
        }], { session });

        // Create General Transaction record
        await Transaction.create([{
            userId: user.id,
            amount: amount,
            currency: from,
            secondaryAmount: toAmount,
            secondaryCurrency: to,
            type: 'CONVERT',
            status: 'SUCCESS',
            rate,
            fee: totalFees,
            netAmount: toAmount,
            description: `Exchanged ${amount} ${from} to ${toAmount.toFixed(2)} ${to}`,
            mpesaReceiptNumber: txId, // Store receipt ID
            createdAt: new Date()
        }], { session });

        await session.commitTransaction();

        // Send notification asynchronously
        await sendNotification(
            user.id,
            "Exchange Successful",
            `Swapped ${amount} ${from} for ${toAmount.toFixed(2)} ${to}`,
            'FINANCE'
        );

        return NextResponse.json({
            success: true,
            message: 'Exchange successful',
            transactionId: txId,
            referenceNumber: referenceId,
            fromCurrency: from,
            toCurrency: to,
            amount: amount,
            received: toAmount,
            rate,
            exchangeFee,
            networkFee,
            timestamp: exchangeTx.createdAt
        });

    } catch (error: any) {
        await session.abortTransaction();
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        session.endSession();
    }
}
