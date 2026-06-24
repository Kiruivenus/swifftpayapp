import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import PlatformFeesLimits from '@/models/PlatformFeesLimits';
import PlatformSettings from '@/models/PlatformSettings';
import { verifyAuth } from '@/lib/auth';
import { checkMaintenance } from '@/lib/maintenance';
import { decrypt } from '@/lib/encryption';
import SecurityEvent from '@/models/SecurityEvent';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        // 1. Check Maintenance Mode
        const maintenance = await checkMaintenance();
        if (maintenance.isMaintenance) return maintenance.response!;

        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, phoneNumber, amount, pin } = body;
        const currency = body.currency || 'KES';

        if (!amount || amount <= 0) {
            return NextResponse.json({ message: 'Invalid amount' }, { status: 400 });
        }

        if (currency === 'KES' && (!name || !phoneNumber)) {
            return NextResponse.json({ message: 'Invalid KES withdrawal details' }, { status: 400 });
        }

        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Check if account is locked
        if (dbUser.status === 'BLOCKED') {
            return NextResponse.json({ message: 'Account is locked. Withdrawals are disabled.' }, { status: 403 });
        }

        // Verify withdrawal PIN
        if (dbUser.pinHash) {
            if (!pin) {
                return NextResponse.json({ message: 'Withdrawal PIN is required.' }, { status: 400 });
            }
            const pinMatch = await bcrypt.compare(pin, dbUser.pinHash);
            if (!pinMatch) {
                // Log failed PIN verification for velocity security
                await SecurityEvent.create({
                    type: 'SENSITIVE_ACTION',
                    severity: 'medium',
                    userId: dbUser._id,
                    ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
                    message: 'Failed withdrawal PIN verification attempt.'
                });
                return NextResponse.json({ message: 'Incorrect withdrawal PIN.' }, { status: 401 });
            }
        }

        // 2. Fetch Configurable Fees & Limits
        const feesLimits = await (PlatformFeesLimits as any).getSettings();
        const settings = await (PlatformSettings as any).getSettings();

        // Check if global withdrawals are disabled
        if (!settings.withdrawalsEnabled) {
            return NextResponse.json({ message: 'Withdrawals are currently disabled by platform administrators.' }, { status: 403 });
        }

        // A. Min Withdrawal Check
        const minWithdraw = feesLimits.minWithdrawByCurrency?.[currency] || 50;
        if (amount < minWithdraw) {
            return NextResponse.json({
                message: `Minimum withdrawal for ${currency} is ${minWithdraw}`
            }, { status: 400 });
        }

        // B. Daily Limit Check
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const dailyVolume = await Transaction.aggregate([
            {
                $match: {
                    userId: user.id,
                    type: 'WITHDRAW',
                    currency: currency,
                    status: { $in: ['PENDING', 'SUCCESS'] },
                    createdAt: { $gte: startOfDay }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const currentDailyTotal = dailyVolume.length > 0 ? dailyVolume[0].total : 0;
        const dailyLimit = feesLimits.dailyLimitVerifiedByCurrency?.[currency] || 100000;

        if (currentDailyTotal + amount > dailyLimit) {
            return NextResponse.json({
                message: `Daily withdrawal limit for ${currency} reached. Remaining: ${Math.max(0, dailyLimit - currentDailyTotal)}`
            }, { status: 400 });
        }

        // C. Rate Limiting / Velocity Checks (Max 5 withdrawals every 10 minutes)
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentWithdrawalsCount = await Transaction.countDocuments({
            userId: user.id,
            type: 'WITHDRAW',
            createdAt: { $gte: tenMinsAgo }
        });
        if (recentWithdrawalsCount >= 5) {
            return NextResponse.json({ message: 'Rate limit exceeded. Maximum 5 withdrawals allowed every 10 minutes.' }, { status: 429 });
        }

        // D. Auto-format phone number
        let formattedPhone = phoneNumber.trim().replace(/\s+/g, '').replace('+', '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '254' + formattedPhone.slice(1);
        } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
            formattedPhone = '254' + formattedPhone;
        }

        if (!/^254[17]\d{8}$/.test(formattedPhone)) {
            return NextResponse.json({ message: 'Invalid Kenyan phone number format. Must start with 07, 01, 2547, or 2541.' }, { status: 400 });
        }

        // E. Operator Detection
        let operator = 'SAFARICOM';
        const airtelPrefixes = ['25473', '25475', '25478', '254100', '254101', '254102', '254103', '254104', '254105', '254106'];
        if (airtelPrefixes.some(prefix => formattedPhone.startsWith(prefix))) {
            operator = 'AIRTEL';
        }

        // F. Duplicate Withdrawal Prevention (Exact same amount and phone in last 2 mins)
        const duplicateTx = await Transaction.findOne({
            userId: user.id,
            type: 'WITHDRAW',
            amount: amount,
            phoneNumber: formattedPhone,
            status: 'PENDING',
            createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
        });
        if (duplicateTx) {
            return NextResponse.json({ message: 'A duplicate withdrawal request was detected. Please wait 2 minutes.' }, { status: 400 });
        }

        // 3. Balance & Pending Check
        const pendingWithdrawals = await Transaction.aggregate([
            { $match: { userId: user.id, type: 'WITHDRAW', currency: currency, status: 'PENDING' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const pendingAmount = pendingWithdrawals.length > 0 ? pendingWithdrawals[0].total : 0;

        const balance = dbUser.kesBalance;
        const availableBalance = balance - pendingAmount;

        if (amount > availableBalance) {
            return NextResponse.json({ message: 'Insufficient available KES balance' }, { status: 400 });
        }

        // 4. Calculate Fee
        const feePercent = feesLimits.withdrawalFeePercent || 1.5;
        const fee = amount * (feePercent / 100);
        const netAmount = amount - fee;

        if (amount <= fee) {
            return NextResponse.json({ message: 'Amount must be greater than withdrawal fees' }, { status: 400 });
        }

        // 5. Create Transaction Record (Deduct immediately to prevent double spend)
        dbUser.kesBalance = dbUser.kesBalance - amount;
        await dbUser.save();

        const transaction = await Transaction.create({
            userId: user.id,
            amount: amount,
            currency: 'KES',
            type: 'WITHDRAW',
            status: 'PENDING',
            phoneNumber: formattedPhone,
            recipientId: name,
            fee: fee,
            netAmount: netAmount,
            network: operator,
            createdAt: new Date(),
            metadata: {
                initiatedBy: user.id,
                ip: req.headers.get('x-forwarded-for') || '127.0.0.1',
                userAgent: req.headers.get('user-agent') || 'Unknown',
                operatorDetected: operator
            }
        });

        // 6. Palpluss API Integration
        const PALPLUSS_API_KEY = settings.palplussApiKey ? decrypt(settings.palplussApiKey) : process.env.PALPLUSS_API_KEY;
        const PALPLUSS_ENV = settings.palplussEnvironment || 'sandbox';

        if (!PALPLUSS_API_KEY) {
            console.log('Palpluss API Key not configured. Simulating Sandbox B2C payout.');
            
            // Mock sandbox callback execution in 5 seconds
            setTimeout(async () => {
                try {
                    const callbackEndpoint = `${req.nextUrl.origin}/api/webhooks/palpluss`;
                    await fetch(callbackEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-palpluss-signature': 'sandbox-mock-signature'
                        },
                        body: JSON.stringify({
                            event: 'transaction.updated',
                            event_type: 'transaction.success',
                            transaction: {
                                id: 'mock-palpluss-b2c-' + Math.random().toString(36).substring(2, 11),
                                status: 'SUCCESS',
                                amount: netAmount,
                                currency: 'KES',
                                phone_number: formattedPhone,
                                external_reference: transaction._id.toString(),
                                provider: 'm-pesa',
                                mpesa_receipt: 'REC' + Math.random().toString(36).substring(2, 9).toUpperCase(),
                                result_code: '0',
                                result_desc: 'The service request is processed successfully.'
                            }
                        })
                    });
                } catch (err) {
                    console.error('Failed to trigger mock sandbox webhook callback:', err);
                }
            }, 5000);

            return NextResponse.json({
                success: true,
                message: 'Withdrawal initiated successfully (Sandbox Simulation)',
                transactionId: transaction._id,
                reference: transaction._id.toString(),
                fee,
                netAmount
            });
        }

        // Call Palpluss API
        try {
            const authHeader = `Basic ${Buffer.from(PALPLUSS_API_KEY + ':').toString('base64')}`;
            const callbackUrl = `${req.nextUrl.origin}/api/webhooks/palpluss`;

            const palplussResponse = await fetch('https://api.palpluss.com/v1/b2c', {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: netAmount,
                    phoneNumber: formattedPhone,
                    phone: formattedPhone, // support both naming conventions in standard body
                    reference: transaction._id.toString(),
                    external_reference: transaction._id.toString(),
                    callbackUrl
                })
            });

            const responseData = await palplussResponse.json().catch(() => ({}));

            if (!palplussResponse.ok) {
                // Refund KES balance on direct API failures
                dbUser.kesBalance = dbUser.kesBalance + amount;
                await dbUser.save();

                transaction.status = 'FAILED';
                transaction.rejectionReason = responseData.message || 'Palpluss API connection failed';
                await transaction.save();

                // Log admin/security event
                await SecurityEvent.create({
                    type: 'SENSITIVE_ACTION',
                    severity: 'high',
                    userId: user.id,
                    message: `Palpluss B2C payout failed to initiate: ${transaction.rejectionReason}`
                });

                return NextResponse.json({
                    success: false,
                    message: responseData.message || 'Disbursement provider failed to initiate transaction.'
                }, { status: 400 });
            }

            // Successfully queued with Palpluss B2C Payout
            transaction.providerReference = responseData.transaction?.id || responseData.id || '';
            transaction.metadata = {
                ...transaction.metadata,
                palplussResponse: responseData
            };
            await transaction.save();

            return NextResponse.json({
                success: true,
                message: 'Withdrawal request initiated successfully. Processing payment.',
                transactionId: transaction._id,
                reference: transaction._id.toString(),
                fee,
                netAmount
            });

        } catch (apiErr: any) {
            // Refund KES balance on catch errors
            dbUser.kesBalance = dbUser.kesBalance + amount;
            await dbUser.save();

            transaction.status = 'FAILED';
            transaction.rejectionReason = apiErr.message || 'Palpluss integration connection timeout';
            await transaction.save();

            return NextResponse.json({
                success: false,
                message: 'Connection timeout with payment gateway. Funds refunded.'
            }, { status: 504 });
        }

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
