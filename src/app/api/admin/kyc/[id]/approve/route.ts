import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import KycRequest from '@/models/KycRequest';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.REVIEW_KYC);
    if (error) return error;

    try {
        await dbConnect();

        const kyc = await KycRequest.findById(id);
        if (!kyc) return NextResponse.json({ message: 'KYC Request not found' }, { status: 404 });

        if (kyc.status !== 'PENDING') {
            return NextResponse.json({ message: `This request has already been ${kyc.status.toLowerCase()}.` }, { status: 400 });
        }

        // update request
        kyc.status = 'APPROVED';
        kyc.reviewedAt = new Date();
        kyc.reviewedBy = admin.id;
        await kyc.save();

        // Send Notification
        await sendNotification(
            kyc.userId.toString(),
            "Verification Successful",
            "Your KYC verification has been approved. Welcome to SwiftPay!",
            "SYSTEM"
        );

        // update user
        await User.findByIdAndUpdate(kyc.userId, {
            $set: { kycStatus: 'APPROVED' }
        });

        // Audit log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'APPROVE_KYC',
            targetType: 'KYC',
            targetId: id,
            details: { userId: kyc.userId, documentNumber: kyc.documentNumber },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, message: 'KYC request approved successfully.' });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
