import User from '@/models/User';
import KycRequest from '@/models/KycRequest';

export async function resolveAudienceFilter(targetAudience: {
    scope: string;
    countries?: string[];
    userIds?: string[];
}) {
    const { scope, countries, userIds } = targetAudience;
    let query: any = { role: 'user' }; // Only target end-users by default

    switch (scope) {
        case 'ALL_USERS':
            break;
        case 'VERIFIED_ONLY':
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
        case 'KYC_APPROVED':
            const approvedIds = await KycRequest.find({ status: 'APPROVED' }).distinct('userId');
            query._id = { $in: approvedIds };
            break;
        case 'KYC_REJECTED':
            const rejectedIds = await KycRequest.find({ status: 'REJECTED' }).distinct('userId');
            query._id = { $in: rejectedIds };
            break;
        case 'COUNTRY':
            if (countries && countries.length > 0) {
                query.country = { $in: countries };
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
