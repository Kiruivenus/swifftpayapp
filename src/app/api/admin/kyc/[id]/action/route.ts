import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import KycRequest from '@/models/KycRequest';
import User from '@/models/User';
import Session from '@/models/Session';
import SecurityEvent from '@/models/SecurityEvent';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';
import { sendNotification } from '@/lib/notifications';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.REVIEW_KYC);
    if (error) return error;

    try {
        const { action, reason, notes } = await req.json();

        if (!action) {
            return NextResponse.json({ message: 'Action parameter is required.' }, { status: 400 });
        }

        await dbConnect();

        const kyc = await KycRequest.findById(id);
        if (!kyc) return NextResponse.json({ message: 'KYC Request not found.' }, { status: 404 });

        const userIdStr = kyc.userId.toString();
        const user = await User.findById(kyc.userId);
        if (!user) return NextResponse.json({ message: 'Owner user not found.' }, { status: 404 });

        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        kyc.reviewedAt = new Date();
        kyc.reviewedBy = admin.id;
        if (notes) kyc.internalNotes = notes;

        // Structured Audit Trail Entry
        const auditEntry = {
            reviewerName: admin.name || admin.email,
            reviewerRole: admin.role,
            action,
            timestamp: new Date(),
            notes: notes || reason || ''
        };

        if (action === 'APPROVE') {
            kyc.status = 'APPROVED';
            kyc.rejectionReason = '';
            user.kycStatus = 'APPROVED';
            await Promise.all([kyc.save(), user.save()]);

            // Dispatch Notifications
            await sendNotification(
                userIdStr,
                "KYC Verification Approved",
                "Your identity documents have been approved. Welcome to borderless payments on SwiftPay!",
                "SYSTEM"
            );

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'APPROVE_KYC',
                targetType: 'KYC',
                targetId: id,
                details: { userId: userIdStr, docNumber: kyc.documentNumber },
                ipAddress: ip,
                userAgent: ua
            });

        } else if (action === 'REJECT') {
            if (!reason) return NextResponse.json({ message: 'Rejection reason is required.' }, { status: 400 });

            kyc.status = 'REJECTED';
            kyc.rejectionReason = reason;
            user.kycStatus = 'REJECTED';
            await Promise.all([kyc.save(), user.save()]);

            // Dispatch Notifications
            await sendNotification(
                userIdStr,
                "KYC Verification Rejected",
                `Your identity verification was rejected. Reason: ${reason}. Please update your details and try again.`,
                "SYSTEM"
            );

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'REJECT_KYC',
                targetType: 'KYC',
                targetId: id,
                details: { userId: userIdStr, reason },
                ipAddress: ip,
                userAgent: ua,
                severity: 'WARNING'
            });

        } else if (action === 'REQUEST_RESUBMISSION') {
            if (!reason) return NextResponse.json({ message: 'Details/Reason for resubmission request is required.' }, { status: 400 });

            kyc.status = 'RESUBMISSION_REQUESTED';
            kyc.rejectionReason = reason;
            
            // Set user KYC status back to NOT_STARTED so mobile app lets them re-submit
            user.kycStatus = 'NOT_STARTED';
            await Promise.all([kyc.save(), user.save()]);

            // Dispatch Notifications
            await sendNotification(
                userIdStr,
                "KYC Resubmission Required",
                `Please re-submit your identity documents. Issue details: ${reason}`,
                "SYSTEM"
            );

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'REQUEST_KYC_RESUBMISSION',
                targetType: 'KYC',
                targetId: id,
                details: { userId: userIdStr, reason },
                ipAddress: ip,
                userAgent: ua,
                severity: 'INFO'
            });

        } else if (action === 'ESCALATE') {
            kyc.status = 'ESCALATED';
            await kyc.save();

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'ESCALATE_KYC',
                targetType: 'KYC',
                targetId: id,
                details: { userId: userIdStr, comments: notes },
                ipAddress: ip,
                userAgent: ua,
                severity: 'WARNING'
            });

        } else if (action === 'BLACKLIST') {
            // Blacklist User: Block Account + Force Logout + Reject KYC
            kyc.status = 'REJECTED';
            kyc.rejectionReason = 'Account restricted due to policy and fraud compliance violations.';
            
            user.kycStatus = 'REJECTED';
            user.status = 'BLOCKED';
            
            await Promise.all([kyc.save(), user.save()]);

            // Invalidate all active sessions
            await Session.updateMany(
                { userId: userIdStr, status: 'active' },
                { $set: { status: 'revoked' } }
            );

            // Security Event log on user
            await SecurityEvent.create({
                type: 'SESSION_REVOKED',
                severity: 'high',
                userId: userIdStr,
                adminId: admin.id,
                ip,
                userAgent: ua,
                message: `Account blacklisted and locked due to compliance audit failure.`
            });

            // Audit Log
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'BLACKLIST_USER',
                targetType: 'USER',
                targetId: userIdStr,
                details: { username: user.username, kycRequestId: id },
                ipAddress: ip,
                userAgent: ua,
                severity: 'CRITICAL'
            });
        } else {
            return NextResponse.json({ message: `Action "${action}" is not recognized.` }, { status: 400 });
        }

        // Add log entry to document trail list
        await KycRequest.findByIdAndUpdate(id, {
            $push: { auditTrail: auditEntry }
        });

        return NextResponse.json({ success: true, message: `KYC action "${action}" completed successfully.` });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
