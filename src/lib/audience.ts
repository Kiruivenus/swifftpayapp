import User from '@/models/User';
import KycRequest from '@/models/KycRequest';
import Session from '@/models/Session';
import Transaction from '@/models/Transaction';

export async function resolveAudienceFilter(targetAudience: {
    scope: string;
    countries?: string[];
    userIds?: string[];
}) {
    const { scope, countries, userIds } = targetAudience;
    let query: any = { role: 'user', isDeleted: { $ne: true } }; // Only target end-users by default

    switch (scope) {
        case 'ALL_USERS':
            break;
        case 'VERIFIED_ONLY':
        case 'KYC_APPROVED':
            // Users with APPROVED KycRequest
            const approvedKycUsers = await KycRequest.find({ status: 'APPROVED' }).distinct('userId');
            query._id = { $in: approvedKycUsers };
            break;
        case 'UNVERIFIED_ONLY':
            // Users without any APPROVED KycRequest
            const hasKycUsers = await KycRequest.find({ status: 'APPROVED' }).distinct('userId');
            query._id = { $nin: hasKycUsers };
            break;
        case 'KYC_PENDING':
            const pendingKycUsers = await KycRequest.find({ status: 'PENDING' }).distinct('userId');
            query._id = { $in: pendingKycUsers };
            break;
        case 'KYC_REJECTED':
            const rejectedIds = await KycRequest.find({ status: 'REJECTED' }).distinct('userId');
            query._id = { $in: rejectedIds };
            break;
        case 'ACTIVE_USERS':
            // Users active within the last 7 days
            const activeSessionUserIds = await Session.find({
                lastSeenAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }).distinct('userId');
            query._id = { $in: activeSessionUserIds };
            break;
        case 'INACTIVE_USERS':
            // Users inactive for more than 30 days
            const activeSessionIds30 = await Session.find({
                lastSeenAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }).distinct('userId');
            query._id = { $nin: activeSessionIds30 };
            break;
        case 'NEW_USERS':
            // Users registered within the last 48 hours
            query.createdAt = { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) };
            break;
        case 'PREMIUM_USERS':
            // Users with balance over 1,000 USDT or 130,000 KES
            query.$or = [
                { usdtBalance: { $gt: 1000 } },
                { kesBalance: { $gt: 130000 } }
            ];
            break;
        case 'WITH_DEPOSITS':
            // Users who completed at least one successful deposit
            const withDepositUserIds = await Transaction.find({
                type: 'DEPOSIT',
                status: 'SUCCESS'
            }).distinct('userId');
            query._id = { $in: withDepositUserIds };
            break;
        case 'WITHOUT_DEPOSITS':
            // Users without any successful deposit
            const noDepositUserIds = await Transaction.find({
                type: 'DEPOSIT',
                status: 'SUCCESS'
            }).distinct('userId');
            query._id = { $nin: noDepositUserIds };
            break;
        case 'HIGH_VALUE_USERS':
            // Users with high volume transactions (over 500 USDT / 65,000 KES) or premium balances
            const highValUserIds = await Transaction.find({
                status: 'SUCCESS',
                amount: { $gt: 500 }
            }).distinct('userId');
            query.$or = [
                { _id: { $in: highValUserIds } },
                { usdtBalance: { $gt: 1000 } },
                { kesBalance: { $gt: 130000 } }
            ];
            break;
        case 'REFERRAL_USERS':
            // Reconstructed referred segment from users who received peer-to-peer transfers
            const referralRecipients = await Transaction.find({
                type: 'TRANSFER_RECEIVE',
                status: 'SUCCESS'
            }).distinct('userId');
            query._id = { $in: referralRecipients };
            break;
        case 'SUSPENDED_USERS':
            query.status = 'BLOCKED';
            break;
        case 'COUNTRY':
            if (countries && countries.length > 0) {
                query.countryCode = { $in: countries };
            }
            break;
        case 'CUSTOM_QUERY':
            if (userIds && userIds.length > 0) {
                query._id = { $in: userIds };
            }
            break;
    }

    return query;
}
