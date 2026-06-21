import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import KycRequest from '@/models/KycRequest';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.REVIEW_KYC);
    if (error) return error;

    try {
        await dbConnect();

        const pending = await KycRequest.countDocuments({ status: 'PENDING' });
        const approved = await KycRequest.countDocuments({ status: 'APPROVED' });
        const rejected = await KycRequest.countDocuments({ status: 'REJECTED' });
        const escalated = await KycRequest.countDocuments({ status: 'ESCALATED' });
        const resubmission = await KycRequest.countDocuments({ status: 'RESUBMISSION_REQUESTED' });

        // Calculate success rate
        const totalConcluded = approved + rejected + resubmission;
        const successRate = totalConcluded > 0 ? Math.round((approved / totalConcluded) * 100) : 100;

        // Calculate average review time (in minutes)
        const reviewedRequests = await KycRequest.find({
            status: { $in: ['APPROVED', 'REJECTED'] },
            reviewedAt: { $ne: null }
        });

        let avgReviewTimeMinutes = 0;
        if (reviewedRequests.length > 0) {
            const totalMs = reviewedRequests.reduce((acc, curr) => {
                if (curr.reviewedAt && curr.submittedAt) {
                    return acc + (curr.reviewedAt.getTime() - curr.submittedAt.getTime());
                }
                return acc;
            }, 0);
            avgReviewTimeMinutes = Math.round((totalMs / reviewedRequests.length) / 60000);
        }

        // Count High-Risk applications (risk score >= 60 in AI checks)
        const highRisk = await KycRequest.countDocuments({
            'aiChecks.riskScore': { $gte: 60 }
        });

        return NextResponse.json({
            success: true,
            analytics: {
                pending,
                approved,
                rejected,
                escalated,
                resubmission,
                totalConcluded,
                successRate,
                avgReviewTimeMinutes,
                highRisk
            }
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
