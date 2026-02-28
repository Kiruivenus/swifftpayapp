import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import KycRequest from '@/models/KycRequest';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.REVIEW_KYC);
    if (error) return error;

    try {
        await dbConnect();

        const request = await KycRequest.findById(params.id);
        if (!request) return NextResponse.json({ message: 'KYC Request not found' }, { status: 404 });

        if (request.status !== 'PENDING') {
            return NextResponse.json({ message: `This request has already been ${request.status.toLowerCase()}.` }, { status: 400 });
        }

        // update request
        request.status = 'APPROVED';
        request.reviewedAt = new Date();
        request.reviewedBy = admin.id;
        await request.save();

        // update user
        await User.findByIdAndUpdate(request.userId, {
            $set: { kycStatus: 'APPROVED' }
        });

        // Audit log
        await logAdminAction(admin.id, 'APPROVE_KYC', 'KYC', params.id, `Approved KYC for user ${request.userId}`);

        return NextResponse.json({ success: true, message: 'KYC request approved successfully.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
