import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import Session from '@/models/Session';
import SecurityEvent from '@/models/SecurityEvent';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

// Automated Fraud Engine
async function scanAndFlagTransactions() {
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Past 24 hours
        const txs = await Transaction.find({ isFlagged: false, createdAt: { $gte: since } });

        for (const tx of txs) {
            let flagReason = '';

            // Rule A: Large Transactions
            if (tx.currency === 'KES' && tx.amount > 250000) {
                flagReason = 'Large transaction detected (Amount > 250,000 KES)';
            } else if (tx.currency === 'USDT' && tx.amount > 2000) {
                flagReason = 'Large transaction detected (Amount > 2,000 USDT)';
            }

            // Rule B: Duplicate Transactions
            if (!flagReason) {
                const duplicate = await Transaction.findOne({
                    _id: { $ne: tx._id },
                    userId: tx.userId,
                    amount: tx.amount,
                    currency: tx.currency,
                    type: tx.type,
                    createdAt: {
                        $gte: new Date(tx.createdAt.getTime() - 2 * 60 * 1000), // Within 2 minutes
                        $lte: new Date(tx.createdAt.getTime() + 2 * 60 * 1000)
                    }
                });
                if (duplicate) {
                    flagReason = `Potential duplicate transaction (matches ID ${duplicate._id.toString().slice(-8)} within 2 mins)`;
                }
            }

            // Rule C: Velocity Alert (Quick Convert followed by Withdrawal)
            if (!flagReason && tx.type === 'WITHDRAW') {
                const conversion = await Transaction.findOne({
                    userId: tx.userId,
                    type: 'CONVERT',
                    createdAt: {
                        $gte: new Date(tx.createdAt.getTime() - 10 * 60 * 1000), // 10 minutes window
                        $lte: tx.createdAt
                    }
                });
                if (conversion) {
                    flagReason = 'Velocity alert: Rapid conversion followed by withdrawal request within 10 minutes';
                }
            }

            // Save flagged transaction
            if (flagReason) {
                tx.isFlagged = true;
                tx.flagReason = flagReason;
                await tx.save();

                // Log a warning security event
                await SecurityEvent.create({
                    type: 'SUSPICIOUS_TRANSACTION',
                    severity: 'medium',
                    userId: tx.userId,
                    message: `Transaction ${tx._id} automatically flagged: ${flagReason}`,
                    metadata: { txId: tx._id, amount: tx.amount, currency: tx.currency, type: tx.type }
                });
            }
        }
    } catch (err) {
        console.error('Auto fraud engine scan failed:', err);
    }
}

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.VIEW_TRANSACTIONS);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'weekly'; // daily, weekly, monthly, yearly

    try {
        await dbConnect();

        // 1. Run Automated Fraud Check
        await scanAndFlagTransactions();

        const USD_TO_KES_RATE = 128.5;

        // 2. Fetch User balances
        const users = await User.find({ isDeleted: { $ne: true } });
        let activeWalletBalance = 0;
        users.forEach(u => {
            activeWalletBalance += (u.kesBalance || 0) + ((u.usdtBalance || 0) * USD_TO_KES_RATE);
        });

        // 3. Aggregate transaction calculations (Success only)
        const allSuccessTxs = await Transaction.find({ status: 'SUCCESS' });
        let totalDepositsKES = 0;
        let totalWithdrawalsKES = 0;
        let platformRevenue = 0;
        let transactionVolume = 0;
        let dailyRevenue = 0;
        let monthlyRevenue = 0;

        const now = new Date();
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        let revenueBreakdown = {
            kesFees: 0,
            usdtFees: 0,
            withdrawFees: 0,
            convertFees: 0
        };

        allSuccessTxs.forEach(tx => {
            const amtInKes = tx.amount * (tx.currency === 'USDT' ? USD_TO_KES_RATE : 1);
            const feeInKes = (tx.fee || 0) * (tx.currency === 'USDT' ? USD_TO_KES_RATE : 1);

            transactionVolume += amtInKes;
            platformRevenue += feeInKes;

            if (tx.createdAt >= past24h) {
                dailyRevenue += feeInKes;
            }
            if (tx.createdAt >= past30d) {
                monthlyRevenue += feeInKes;
            }

            if (tx.type === 'DEPOSIT') {
                totalDepositsKES += amtInKes;
            } else if (tx.type === 'WITHDRAW') {
                totalWithdrawalsKES += amtInKes;
                revenueBreakdown.withdrawFees += feeInKes;
            } else if (tx.type === 'CONVERT') {
                revenueBreakdown.convertFees += feeInKes;
            }

            if (tx.currency === 'KES') {
                revenueBreakdown.kesFees += feeInKes;
            } else {
                revenueBreakdown.usdtFees += feeInKes;
            }
        });

        const netProfit = platformRevenue * 0.85; // Platform keeps 85% after service provider fee overheads

        // 4. Treasury Stats Calculations
        // Liquidity: User deposits + Platform net revenue
        const availableLiquidity = activeWalletBalance + netProfit;

        // Reserved Funds: Total of pending, held or escalated withdrawals
        const reservedTxs = await Transaction.find({
            type: 'WITHDRAW',
            status: { $in: ['PENDING', 'HOLD', 'ESCALATED'] }
        });
        let reservedFunds = 0;
        reservedTxs.forEach(tx => {
            reservedFunds += tx.amount * (tx.currency === 'USDT' ? USD_TO_KES_RATE : 1);
        });

        // Pending Settlements: Unconfirmed incoming deposits / transfers
        const pendingInflows = await Transaction.find({
            type: { $in: ['DEPOSIT', 'TRANSFER_RECEIVE'] },
            status: 'PENDING'
        });
        let pendingSettlements = 0;
        pendingInflows.forEach(tx => {
            pendingSettlements += tx.amount * (tx.currency === 'USDT' ? USD_TO_KES_RATE : 1);
        });

        // Cash Flow Forecast: Simple projection based on past 30 days daily average velocity
        const daysToProject = 7;
        const dailyDepositAvg = totalDepositsKES / 30;
        const dailyWithdrawalAvg = totalWithdrawalsKES / 30;
        const forecastedInflow = dailyDepositAvg * daysToProject;
        const forecastedOutflow = dailyWithdrawalAvg * daysToProject;
        const cashFlowForecast = {
            projectedInflow: forecastedInflow,
            projectedOutflow: forecastedOutflow,
            netProjection: forecastedInflow - forecastedOutflow
        };

        // 5. Analytics Charts Datasets
        // Generate chronological labels and metrics based on timeframe
        let chartLabels: string[] = [];
        let depositsData: number[] = [];
        let withdrawalsData: number[] = [];
        let revenueData: number[] = [];
        let activityData: number[] = [];
        let cashflowData: number[] = [];

        if (range === 'daily') {
            // Last 7 days, grouped by day name
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const startOfDay = new Date(date.setHours(0, 0, 0, 0));
                const endOfDay = new Date(date.setHours(23, 59, 59, 999));

                chartLabels.push(dayNames[startOfDay.getDay()]);

                const txs = await Transaction.find({
                    status: 'SUCCESS',
                    createdAt: { $gte: startOfDay, $lte: endOfDay }
                });

                let dep = 0, wit = 0, rev = 0;
                const activeUsers = new Set();

                txs.forEach(t => {
                    const amt = t.amount * (t.currency === 'USDT' ? USD_TO_KES_RATE : 1);
                    const fee = (t.fee || 0) * (t.currency === 'USDT' ? USD_TO_KES_RATE : 1);
                    rev += fee;
                    activeUsers.add(t.userId);

                    if (t.type === 'DEPOSIT') dep += amt;
                    if (t.type === 'WITHDRAW') wit += amt;
                });

                depositsData.push(Math.round(dep));
                withdrawalsData.push(Math.round(wit));
                revenueData.push(Math.round(rev));
                activityData.push(activeUsers.size);
                cashflowData.push(Math.round(dep - wit));
            }
        } else if (range === 'weekly') {
            // Last 8 weeks
            for (let i = 7; i >= 0; i--) {
                const startOfWeek = new Date(now.getTime() - (i * 7 + now.getDay()) * 24 * 60 * 60 * 1000);
                startOfWeek.setHours(0, 0, 0, 0);
                const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

                chartLabels.push(`Wk -${i}`);

                const txs = await Transaction.find({
                    status: 'SUCCESS',
                    createdAt: { $gte: startOfWeek, $lte: endOfWeek }
                });

                let dep = 0, wit = 0, rev = 0;
                const activeUsers = new Set();

                txs.forEach(t => {
                    const amt = t.amount * (t.currency === 'USDT' ? USD_TO_KES_RATE : 1);
                    const fee = (t.fee || 0) * (t.currency === 'USDT' ? USD_TO_KES_RATE : 1);
                    rev += fee;
                    activeUsers.add(t.userId);

                    if (t.type === 'DEPOSIT') dep += amt;
                    if (t.type === 'WITHDRAW') wit += amt;
                });

                depositsData.push(Math.round(dep));
                withdrawalsData.push(Math.round(wit));
                revenueData.push(Math.round(rev));
                activityData.push(activeUsers.size);
                cashflowData.push(Math.round(dep - wit));
            }
        } else if (range === 'monthly') {
            // Last 6 months
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 5; i >= 0; i--) {
                const year = now.getFullYear();
                const month = now.getMonth() - i;
                const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
                const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

                chartLabels.push(monthNames[startOfMonth.getMonth()]);

                const txs = await Transaction.find({
                    status: 'SUCCESS',
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                });

                let dep = 0, wit = 0, rev = 0;
                const activeUsers = new Set();

                txs.forEach(t => {
                    const amt = t.amount * (t.currency === 'USDT' ? USD_TO_KES_RATE : 1);
                    const fee = (t.fee || 0) * (t.currency === 'USDT' ? USD_TO_KES_RATE : 1);
                    rev += fee;
                    activeUsers.add(t.userId);

                    if (t.type === 'DEPOSIT') dep += amt;
                    if (t.type === 'WITHDRAW') wit += amt;
                });

                depositsData.push(Math.round(dep));
                withdrawalsData.push(Math.round(wit));
                revenueData.push(Math.round(rev));
                activityData.push(activeUsers.size);
                cashflowData.push(Math.round(dep - wit));
            }
        } else {
            // Yearly: Last 3 years
            for (let i = 2; i >= 0; i--) {
                const targetYear = now.getFullYear() - i;
                const startOfYear = new Date(targetYear, 0, 1, 0, 0, 0, 0);
                const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

                chartLabels.push(targetYear.toString());

                const txs = await Transaction.find({
                    status: 'SUCCESS',
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                });

                let dep = 0, wit = 0, rev = 0;
                const activeUsers = new Set();

                txs.forEach(t => {
                    const amt = t.amount * (t.currency === 'USDT' ? USD_TO_KES_RATE : 1);
                    const fee = (t.fee || 0) * (t.currency === 'USDT' ? USD_TO_KES_RATE : 1);
                    rev += fee;
                    activeUsers.add(t.userId);

                    if (t.type === 'DEPOSIT') dep += amt;
                    if (t.type === 'WITHDRAW') wit += amt;
                });

                depositsData.push(Math.round(dep));
                withdrawalsData.push(Math.round(wit));
                revenueData.push(Math.round(rev));
                activityData.push(activeUsers.size);
                cashflowData.push(Math.round(dep - wit));
            }
        }

        const activeSessions = await Session.countDocuments({ status: 'active' });

        return NextResponse.json({
            success: true,
            overview: {
                totalDepositsKES,
                totalWithdrawalsKES,
                platformRevenue,
                netProfit,
                transactionVolume,
                dailyRevenue,
                monthlyRevenue,
                activeWalletBalance,
                activeSessions
            },
            treasury: {
                availableLiquidity,
                reservedFunds,
                pendingSettlements,
                cashFlowForecast,
                revenueBreakdown
            },
            charts: {
                labels: chartLabels,
                deposits: depositsData,
                withdrawals: withdrawalsData,
                revenue: revenueData,
                activity: activityData,
                cashflow: cashflowData
            }
        });

    } catch (err: any) {
        console.error('GET Finance Metrics Error:', err);
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
