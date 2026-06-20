import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Broadcast from '@/models/Broadcast';
import BroadcastDelivery from '@/models/BroadcastDelivery';
import UserNotification from '@/models/UserNotification';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';
import { resolveAudienceFilter } from '@/lib/audience';

// GET individual broadcast details and stats
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        await dbConnect();
        const broadcast = await Broadcast.findById(params.id).populate('createdByAdminId', 'name email');
        if (!broadcast) {
            return NextResponse.json({ success: false, message: 'Broadcast not found' }, { status: 404 });
        }

        // Get delivery stats logs for open/click visualization
        const deliveries = await BroadcastDelivery.find({ broadcastId: params.id });

        return NextResponse.json({
            success: true,
            broadcast,
            deliveries
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// PATCH to update broadcast draft
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.BROADCAST_NOTIFICATIONS);
    if (error) return error;

    try {
        const body = await req.json();
        const { title, message, targetAudience, channels, sendNow } = body;

        await dbConnect();
        const broadcast = await Broadcast.findById(params.id);
        if (!broadcast) {
            return NextResponse.json({ success: false, message: 'Broadcast not found' }, { status: 404 });
        }

        if (broadcast.status !== 'DRAFT') {
            return NextResponse.json({ success: false, message: 'Only drafts can be edited' }, { status: 400 });
        }

        if (title) broadcast.title = title;
        if (message) broadcast.message = message;
        if (targetAudience) broadcast.targetAudience = targetAudience;
        if (channels) broadcast.channels = channels;

        if (sendNow) {
            broadcast.status = 'QUEUED';
            broadcast.sentAt = new Date();
        }

        // Re-resolve target estimate if changed
        const query = await resolveAudienceFilter(broadcast.targetAudience);
        const recipients = await User.find(query).select('_id');
        broadcast.stats.targeted = recipients.length;

        await broadcast.save();

        if (sendNow && recipients.length > 0) {
            const deliveries = [];
            const userNotifications = [];

            for (const recipient of recipients) {
                if (broadcast.channels.push) {
                    deliveries.push({
                        broadcastId: broadcast._id,
                        userId: recipient._id,
                        channel: 'push',
                        status: 'QUEUED'
                    });
                }
                if (broadcast.channels.email) {
                    deliveries.push({
                        broadcastId: broadcast._id,
                        userId: recipient._id,
                        channel: 'email',
                        status: 'QUEUED'
                    });
                }
                if (broadcast.channels.inApp) {
                    deliveries.push({
                        broadcastId: broadcast._id,
                        userId: recipient._id,
                        channel: 'inApp',
                        status: 'SENT',
                        sentAt: new Date()
                    });
                    userNotifications.push({
                        userId: recipient._id,
                        title: broadcast.title,
                        message: broadcast.message,
                        type: 'BROADCAST',
                        refId: broadcast._id.toString()
                    });
                }
            }

            if (deliveries.length > 0) await BroadcastDelivery.insertMany(deliveries);
            if (userNotifications.length > 0) await UserNotification.insertMany(userNotifications);

            // Trigger sending (async)
            const { sendNotification } = await import('@/lib/notifications');
            for (const recipient of recipients) {
                if (broadcast.channels.push || broadcast.channels.email) {
                    sendNotification(recipient._id.toString(), broadcast.title, broadcast.message, 'BROADCAST', {
                        push: !!broadcast.channels.push,
                        email: !!broadcast.channels.email,
                        inApp: false,
                        refId: broadcast._id.toString()
                    }).catch(e => console.error(`Resend failed for ${recipient._id}:`, e));
                }
            }

            if (broadcast.channels.inApp) {
                broadcast.stats.sent += recipients.length;
                await broadcast.save();
            }

            // Audit log
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'SEND_BROADCAST',
                targetType: 'SYSTEM',
                targetId: broadcast._id.toString(),
                details: { title: broadcast.title, targetedCount: recipients.length, channels: broadcast.channels },
                ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
                userAgent: req.headers.get('user-agent') || 'Unknown',
                severity: 'INFO'
            });
        }

        return NextResponse.json({ success: true, broadcast });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

// DELETE to remove broadcast draft
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.BROADCAST_NOTIFICATIONS);
    if (error) return error;

    try {
        await dbConnect();
        const broadcast = await Broadcast.findById(params.id);
        if (!broadcast) {
            return NextResponse.json({ success: false, message: 'Broadcast not found' }, { status: 404 });
        }

        // Remove broadcast
        await Broadcast.deleteOne({ _id: params.id });
        await BroadcastDelivery.deleteMany({ broadcastId: params.id });

        // Audit log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'DELETE_BROADCAST',
            targetType: 'SYSTEM',
            targetId: params.id,
            details: { title: broadcast.title },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown',
            severity: 'WARNING'
        });

        return NextResponse.json({ success: true, message: 'Broadcast deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
