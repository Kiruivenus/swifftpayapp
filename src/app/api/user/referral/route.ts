import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';
import User from '@/models/User';
import Referral from '@/models/Referral';
import PlatformSettings from '@/models/PlatformSettings';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const authUser = await verifyAuth(req);
        if (!authUser) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const user = await User.findById(authUser.id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Generate referralCode if it doesn't exist (backward compatibility)
        if (!user.referralCode) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = '';
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            user.referralCode = code;
            await user.save();
        }

        const settings = await (PlatformSettings as any).getSettings();

        // Get total referred count and completed earnings
        const referrals = await Referral.find({ referrerId: user._id })
            .populate('referredUserId', 'username email createdAt status')
            .sort({ createdAt: -1 });

        const totalEarned = referrals
            .filter((r: any) => r.status === 'COMPLETED')
            .reduce((sum: number, r: any) => sum + (r.rewardAmount || 0), 0);

        const totalReferredCount = referrals.length;

        // Construct referral list response
        const referralsList = referrals.map((r: any) => {
            const referred = r.referredUserId;
            let displayUsername = 'Anonymous User';
            if (referred) {
                if (referred.username) {
                    displayUsername = referred.username;
                } else if (referred.email) {
                    const parts = referred.email.split('@');
                    displayUsername = parts[0].substring(0, 3) + '***@' + parts[1];
                }
            }
            return {
                username: displayUsername,
                status: r.status,
                rewardAmount: r.rewardAmount || 0,
                joinedAt: r.createdAt || new Date()
            };
        });

        // Construct invite link
        const baseUrl = settings.callbackBaseUrl || 'https://swiftpay.ke';
        const inviteLink = `${baseUrl}/register?inviteCode=${user.referralCode}`;

        return NextResponse.json({
            referralCode: user.referralCode,
            inviteLink,
            totalEarned,
            totalReferredCount,
            referralEnabled: settings.referralEnabled ?? true,
            minRewardUsd: settings.referralMinRewardUsd ?? 2.00,
            maxRewardUsd: settings.referralMaxRewardUsd ?? 10.00,
            requirements: {
                cardSpendUsd: settings.referralCardSpendRequirementUsd ?? 5.00,
                cardSpendDays: settings.referralCardSpendDaysLimit ?? 14,
                depositUsd: settings.referralDepositRequirementUsd ?? 100.00
            },
            referralsList
        });

    } catch (err: any) {
        console.error('Error fetching referral data:', err);
        return NextResponse.json({ message: err.message || 'Server error' }, { status: 500 });
    }
}
