import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Broadcast from '@/models/Broadcast';
import BroadcastDelivery from '@/models/BroadcastDelivery';
import UserNotification from '@/models/UserNotification';
import { resolveAudienceFilter } from '@/lib/audience';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        await dbConnect();
        const broadcasts = await Broadcast.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdByAdminId', 'name email');

        const total = await Broadcast.countDocuments();

        return NextResponse.json({
            success: true,
            broadcasts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.BROADCAST_NOTIFICATIONS);
    if (error) return error;

    try {
        const body = await req.json();
        const { title, message, targetAudience, channels, sendNow } = body;

        if (!title || !message || !targetAudience || !channels) {
            return NextResponse.json({ success: false, message: 'Required fields missing' }, { status: 400 });
        }

        await dbConnect();

        // 1. Resolve Recipients
        const query = await resolveAudienceFilter(targetAudience);
        const recipients = await User.find(query).select('_id');
        const targetedCount = recipients.length;

        // 2. Create Broadcast Record
        const broadcast = await Broadcast.create({
            createdByAdminId: admin.id,
            title,
            message,
            targetAudience,
            channels,
            status: sendNow ? 'QUEUED' : 'DRAFT',
            stats: { targeted: targetedCount },
            sentAt: sendNow ? new Date() : null
        });

        // 3. Queue Deliveries if sendNow
        if (sendNow && targetedCount > 0) {
            const deliveries = [];
            const userNotifications = [];

            for (const recipient of recipients) {
                if (channels.push) {
                    deliveries.push({
                        broadcastId: broadcast._id,
                        userId: recipient._id,
                        channel: 'push',
                        status: 'QUEUED'
                    });
                }
                if (channels.email) {
                    deliveries.push({
                        broadcastId: broadcast._id,
                        userId: recipient._id,
                        channel: 'email',
                        status: 'QUEUED'
                    });
                }
                if (channels.inApp) {
                    deliveries.push({
                        broadcastId: broadcast._id,
                        userId: recipient._id,
                        channel: 'inApp',
                        status: 'SENT', // In-app is effectively sent once created
                        sentAt: new Date()
                    });
                    userNotifications.push({
                        userId: recipient._id,
                        title,
                        message,
                        type: 'BROADCAST',
                        refId: broadcast._id.toString()
                    });
                }
            }

            // Bulk write
            if (deliveries.length > 0) await BroadcastDelivery.insertMany(deliveries);
            if (userNotifications.length > 0) await UserNotification.insertMany(userNotifications);

            // Trigger actual sending (since we don't have a background worker)
            const { sendNotification } = await import('@/lib/notifications');
            for (const recipient of recipients) {
                if (channels.push || channels.email) {
                    // Fire and forget (don't await each to avoid timeout)
                    sendNotification(recipient._id.toString(), title, message, 'BROADCAST', {
                        push: !!channels.push,
                        email: !!channels.email,
                        inApp: false, // already created above
                        refId: broadcast._id.toString()
                    }).catch(e => console.error(`Broadcast failed for ${recipient._id}:`, e));
                }
            }

            // Update stats for in-app
            if (channels.inApp) {
                broadcast.stats.sent += targetedCount;
                await broadcast.save();
            }

            // Audit
            await logAdminAction({
                actorId: admin.id,
                actorName: admin.name || admin.email,
                actorRole: admin.role,
                actionType: 'SEND_BROADCAST',
                targetType: 'SYSTEM',
                targetId: broadcast._id.toString(),
                details: { title, targetedCount, channels },
                ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
                userAgent: req.headers.get('user-agent') || 'Unknown',
                severity: 'INFO'
            });
        }

        return NextResponse.json({ success: true, ...broadcast.toObject() });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
