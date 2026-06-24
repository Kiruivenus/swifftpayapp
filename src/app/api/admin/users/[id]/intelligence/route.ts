import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import KycRequest from '@/models/KycRequest';
import Transaction from '@/models/Transaction';
import Session from '@/models/Session';
import SecurityEvent from '@/models/SecurityEvent';
import Referral from '@/models/Referral';
import UserNotification from '@/models/UserNotification';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error } = await validateAdmin(req, PERMISSIONS.MANAGE_USERS);
    if (error) return error;

    try {
        await dbConnect();

        // 1. Core Profile & Wallet
        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const wallet = await Wallet.findOne({ userId: id });

        // 2. KYC request documents
        const kycDocs = await KycRequest.find({ userId: id }).sort({ submittedAt: -1 });

        // 3. Transactions (Last 50, categorized)
        const transactions = await Transaction.find({ userId: id })
            .sort({ createdAt: -1 })
            .limit(50);

        // 4. Session logs & Device Fingerprints
        const sessions = await Session.find({ userId: id })
            .sort({ lastSeenAt: -1 })
            .limit(20);

        // 5. Security events
        const securityEvents = await SecurityEvent.find({ userId: id })
            .sort({ createdAt: -1 })
            .limit(20);

        const failedLoginCount = await SecurityEvent.countDocuments({
            userId: id,
            type: 'FAILED_LOGIN',
            createdAt: { $gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // past 30 days
        });

        const suspiciousLoginCount = await SecurityEvent.countDocuments({
            userId: id,
            type: 'SUSPICIOUS_LOGIN'
        });

        // 6. Referrals Network
        const referrer = user.referredBy ? await User.findById(user.referredBy, 'username email') : null;
        const referredDocs = await Referral.find({ referrerId: id });
        const referredUsers = await User.find(
            { _id: { $in: referredDocs.map(r => r.referredUserId) } },
            'username email status createdAt'
        );

        // 7. System notifications
        const notifications = await UserNotification.find({ userId: id })
            .sort({ createdAt: -1 })
            .limit(25);

        // Calculate P2P transfer volumes and average sizes
        const p2pTransfers = await Transaction.find({
            userId: id,
            type: { $in: ['TRANSFER_SEND', 'TRANSFER_RECEIVE'] }
        });

        let totalTransferVolumeKES = 0;
        let totalTransferVolumeUSDT = 0;
        let kesCount = 0;
        let usdtCount = 0;

        p2pTransfers.forEach(t => {
            if (t.currency === 'KES') {
                totalTransferVolumeKES += t.amount || 0;
                kesCount++;
            } else if (t.currency === 'USDT') {
                totalTransferVolumeUSDT += t.amount || 0;
                usdtCount++;
            }
        });

        const averageTransferSizeKES = kesCount > 0 ? (totalTransferVolumeKES / kesCount) : 0;
        const averageTransferSizeUSDT = usdtCount > 0 ? (totalTransferVolumeUSDT / usdtCount) : 0;

        // Disputes filed by this user as sender
        const reportedScamsCount = await Transaction.countDocuments({
            senderId: id,
            type: 'TRANSFER_SEND',
            isFlagged: true
        });

        // Disputes filed against this user as recipient
        const scamReportsReceivedCount = await Transaction.countDocuments({
            recipientId: id,
            type: 'TRANSFER_RECEIVE',
            isFlagged: true
        });

        // Account age calculation (days)
        const accountAgeDays = Math.max(0, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000)));

        // Recent transaction velocity past 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentVelocity24h = await Transaction.countDocuments({
            userId: id,
            createdAt: { $gte: oneDayAgo }
        });

        // Recent transaction volume in KES past 24 hours
        const recentVolume24hKESResult = await Transaction.aggregate([
            {
                $match: {
                    userId: id,
                    currency: 'KES',
                    createdAt: { $gte: oneDayAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        const recentVolume24hKES = recentVolume24hKESResult.length > 0 ? recentVolume24hKESResult[0].total : 0;

        // Unique IPs used past 30 days
        const uniqueIPs = new Set<string>();
        sessions.forEach(s => {
            if (s.ipAddress) uniqueIPs.add(s.ipAddress);
        });
        securityEvents.forEach(e => {
            if (e.metadata?.ip) {
                uniqueIPs.add(e.metadata.ip);
            } else if (e.ip) {
                uniqueIPs.add(e.ip);
            }
        });
        const uniqueIPs30d = uniqueIPs.size;

        // Untrusted device count
        const deviceMismatches = await Session.countDocuments({
            userId: id,
            isTrusted: false
        });

        // Calculate security risk score using scam heuristics
        let riskScore = 15; // default base level
        if (user.kycStatus === 'APPROVED') riskScore -= 10;
        if (user.kycStatus === 'REJECTED') riskScore += 20;
        if (user.status === 'BLOCKED') riskScore += 45;
        riskScore += (failedLoginCount * 8);
        riskScore += (suspiciousLoginCount * 15);
        riskScore += (scamReportsReceivedCount * 25);
        riskScore += (reportedScamsCount * 5); // dispute abuse check

        if (accountAgeDays < 7) {
            riskScore += 15;
        } else if (accountAgeDays < 30) {
            riskScore += 5;
        }

        if (sessions.some(s => s.status === 'active' && s.isTrusted === false)) riskScore += 10;
        riskScore = Math.max(0, Math.min(100, riskScore)); // clamp between 0-100

        // Security recommendation
        let riskRecommendation = 'No immediate action required. Monitor standard transaction patterns.';
        if (riskScore > 75) {
            riskRecommendation = 'CRITICAL RISK: Suspend user, revoke all active sessions immediately, and verify source of funds.';
        } else if (riskScore > 45) {
            riskRecommendation = 'HIGH RISK: Temporary freeze KES/USDT fund withdrawals, verify KYC credentials, and prompt password reset.';
        } else if (riskScore > 25) {
            riskRecommendation = 'MEDIUM RISK: Inspect IP geo-location logs and verify active sessions.';
        }

        // Mock support tickets
        const mockTickets = [
            {
                _id: 'ticket_01',
                subject: 'Delayed USDT Transfer clearance',
                category: 'Finance',
                status: 'CLOSED',
                createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000),
                replies: 2
            },
            {
                _id: 'ticket_02',
                subject: 'Trouble updating residential address',
                category: 'Account Settings',
                status: 'RESOLVED',
                createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
                replies: 1
            }
        ];

        return NextResponse.json({
            success: true,
            user,
            wallet,
            kycDocs,
            transactions,
            sessions,
            securityEvents,
            securitySummary: {
                failedLoginCount,
                suspiciousLoginCount,
                riskScore,
                riskRecommendation
            },
            referrals: {
                referrer,
                referredList: referredUsers,
                totalReferred: referredUsers.length
            },
            notifications,
            tickets: mockTickets,
            totalTransferVolumeKES,
            totalTransferVolumeUSDT,
            averageTransferSizeKES,
            averageTransferSizeUSDT,
            reportedScamsCount,
            scamReportsReceivedCount,
            accountAgeDays,
            recentVelocity24h,
            recentVolume24hKES,
            uniqueIPs30d,
            deviceMismatches
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
