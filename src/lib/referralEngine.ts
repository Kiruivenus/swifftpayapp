import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import PlatformSettings from '@/models/PlatformSettings';
import Referral from '@/models/Referral';
import Transaction from '@/models/Transaction';
import { sendNotification } from '@/lib/notifications';

export async function checkAndProcessReferral(referredUserId: string) {
    try {
        await dbConnect();
        
        // Find if this user is a referred user and has a pending referral
        const referral = await Referral.findOne({ referredUserId, status: 'PENDING' });
        if (!referral) return;

        // Fetch general system configurations
        const settings = await (PlatformSettings as any).getSettings();
        if (!settings.referralEnabled) return;

        // Fetch user information
        const referredUser = await User.findById(referredUserId);
        const referrer = await User.findById(referral.referrerId);
        if (!referredUser || !referrer) return;

        const signupDate = referredUser.createdAt || new Date();
        const limitDate = new Date(signupDate.getTime() + settings.referralCardSpendDaysLimit * 24 * 60 * 60 * 1000);

        // Fetch successful transactions
        const txs = await Transaction.find({ userId: referredUserId, status: 'SUCCESS' });

        let cardSpent = referral.cardSpent || false;
        let deposited = referral.deposited || false;

        const rate = settings.usdtToKesRate || 128.5; // KES per USDT/USD conversion rate

        // Check cumulative deposits or single deposit matching limit
        let totalDepositedUsd = 0;
        for (const tx of txs) {
            const amountInUsd = tx.currency === 'USDT' ? tx.amount : tx.amount / rate;

            if (tx.type === 'DEPOSIT') {
                totalDepositedUsd += amountInUsd;
            }

            // Card spend requirement check
            // Since the card is virtual/simulated, we treat any TRANSFER_SEND or WITHDRAW of >= spendRequirement inside limit days as card spend!
            if (['TRANSFER_SEND', 'WITHDRAW'].includes(tx.type) && tx.createdAt <= limitDate) {
                if (amountInUsd >= settings.referralCardSpendRequirementUsd) {
                    cardSpent = true;
                }
            }
        }

        if (totalDepositedUsd >= settings.referralDepositRequirementUsd) {
            deposited = true;
        }

        referral.cardSpent = cardSpent;
        referral.deposited = deposited;

        // Check if either requirement is met to award reward
        if (cardSpent || deposited) {
            // Draw random reward
            const min = settings.referralMinRewardUsd || 2.00;
            const max = settings.referralMaxRewardUsd || 10.00;
            const rewardUsd = Math.round((min + Math.random() * (max - min)) * 100) / 100;

            referral.status = 'COMPLETED';
            referral.rewardAmount = rewardUsd;
            referral.completedAt = new Date();
            await referral.save();

            // Credit reward to referrer's balance based on their currency preference
            const referrerCurrency = referrer.currency || 'USDT';
            const rewardAmount = referrerCurrency === 'KES' ? rewardUsd * rate : rewardUsd;

            if (referrerCurrency === 'KES') {
                referrer.kesBalance = (referrer.kesBalance || 0) + rewardAmount;
            } else {
                referrer.usdtBalance = (referrer.usdtBalance || 0) + rewardAmount;
            }
            await referrer.save();

            // Create a successful DEPOSIT transaction for the referrer as Referral Reward
            const referredName = referredUser.fullName || referredUser.username || referredUser.email;
            await Transaction.create({
                userId: referrer._id.toString(),
                amount: rewardAmount,
                currency: referrerCurrency,
                type: 'DEPOSIT',
                status: 'SUCCESS',
                description: `Referral reward for inviting ${referredName}`,
                createdAt: new Date(),
                processedAt: new Date()
            });

            // Send push notification to referrer
            try {
                await sendNotification(
                    referrer._id.toString(),
                    "Referral Reward Earned",
                    `Congratulations! You earned a referral reward of ${rewardAmount.toFixed(2)} ${referrerCurrency} for inviting ${referredName} to SwiftPay.`,
                    'FINANCE'
                );
            } catch (notifyErr) {
                console.error('Failed to send referral reward notification:', notifyErr);
            }
        } else {
            await referral.save();
        }
    } catch (err) {
        console.error('Error checking and processing referral:', err);
    }
}
