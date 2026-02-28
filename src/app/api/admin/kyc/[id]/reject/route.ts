import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import KycRequest from '@/models/KycRequest';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.REVIEW_KYC);
    if (error) return error;

    try {
        const { reason } = await req.json();
        if (!reason) return NextResponse.json({ message: 'Rejection reason is required' }, { status: 400 });

        await dbConnect();

        const request = await KycRequest.findById(id);
        if (!request) return NextResponse.json({ message: 'KYC Request not found' }, { status: 404 });

        if (request.status !== 'PENDING') {
            return NextResponse.json({ message: `This request has already been ${request.status.toLowerCase()}.` }, { status: 400 });
        }

        // update request
        request.status = 'REJECTED';
        request.rejectionReason = reason;
        request.reviewedAt = new Date();
        request.reviewedBy = admin.id;
        await request.save();

        // update user
        await User.findByIdAndUpdate(request.userId, {
            $set: { kycStatus: 'REJECTED', kycRejectionReason: reason }
        });

        // Audit log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'REJECT_KYC',
            targetType: 'KYC',
            targetId: id,
            details: { userId: request.userId, reason },
            ipAddress: ip,
            userAgent: ua,
            severity: 'WARNING'
        });

        return NextResponse.json({ success: true, message: 'KYC request rejected.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
