import User from '@/models/User';
import NotificationToken from '@/models/NotificationToken';
import UserNotification from '@/models/UserNotification';
import NotificationSettings from '@/models/NotificationSettings';
import { sendEmail } from './email';

export type NotificationType = 'BROADCAST' | 'SYSTEM' | 'SECURITY' | 'FINANCE';

export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    options: { push?: boolean; inApp?: boolean; email?: boolean; refId?: string } = {}
) {
    try {
        const {
            push = true,
            inApp = true,
            email = true,
            refId
        } = options;

        // 1. Fetch User and check preferences
        const user = await User.findById(userId);
        if (!user) return;

        // User-level override (unless it's a critical security alert, we can force those)
        const prefs = user.notificationPrefs || { enabled: true, transactions: true, security: true };

        // If notifications are globally disabled for this user, skip unless it's SECURITY
        if (!prefs.enabled && type !== 'SECURITY') {
            console.log(`[NOTIFY] Skipped for user ${userId} - notifications disabled in prefs`);
            return;
        }

        // Specific category checks
        if (type === 'FINANCE' && !prefs.transactions) return;
        if (type === 'SECURITY' && prefs.security === false) {
            // We usually want security alerts regardless, but if explicitly false, we respect it
            // unless we decide otherwise for system integrity.
        }

        // 2. Check Global Admin Settings
        if (type !== 'BROADCAST') {
            const settings = await (NotificationSettings as any).getSettings();
            if (type === 'SECURITY' && !settings.newLoginDetected) return;
            if (type === 'SYSTEM' && !settings.kycStatusUpdates) return;
            if (type === 'FINANCE') {
                if (title.includes('Deposit') && !settings.depositSuccessful) return;
                if (title.includes('Withdrawal') && !settings.withdrawalProcessed) return;
            }
        }

        // 3. In-App Notification
        if (inApp) {
            const notif = await UserNotification.create({
                userId,
                title,
                message,
                type,
                refId
            });

            // Broadcast via Server-Sent Events (SSE) for real-time drawer updates
            try {
                const { broadcastSSE } = await import('./sse');
                broadcastSSE('notification', {
                    userId,
                    notification: {
                        _id: notif._id,
                        title,
                        message,
                        type,
                        read: false,
                        createdAt: notif.createdAt
                    }
                });
            } catch (sseErr) {
                console.error('[SSE] Failed to broadcast live notification event:', sseErr);
            }
        }

        // 4. Push Notification
        if (push && prefs.enabled) {
            const tokens = await NotificationToken.find({ userId });
            if (tokens.length > 0) {
                const fcmTokens = tokens.map(t => t.fcmToken);
                const { fcm } = await import('./firebase-admin');

                try {
                    await fcm.sendEachForMulticast({
                        tokens: fcmTokens,
                        data: {
                            title,
                            body: message,
                            message,
                            type,
                            category: type === 'FINANCE' ? 'transactions' : 'alerts',
                            refId: refId || '',
                        },
                        android: {
                            priority: 'high'
                        }
                    });
                    console.log(`[PUSH] Sent to user ${userId} (${fcmTokens.length} devices)`);

                    // Update delivery status if it's a broadcast
                    if (type === 'BROADCAST' && refId) {
                        try {
                            const BroadcastDelivery = (await import('@/models/BroadcastDelivery')).default;
                            await BroadcastDelivery.updateOne(
                                { broadcastId: refId, userId, channel: 'push' },
                                { status: 'SENT', sentAt: new Date() }
                            );
                        } catch (dbErr) {
                            console.error('[PUSH] Failed to update BroadcastDelivery status:', dbErr);
                        }
                    }
                } catch (fcmError: any) {
                    console.error('[PUSH] FCM error:', fcmError);
                    if (type === 'BROADCAST' && refId) {
                        try {
                            const BroadcastDelivery = (await import('@/models/BroadcastDelivery')).default;
                            await BroadcastDelivery.updateOne(
                                { broadcastId: refId, userId, channel: 'push' },
                                { status: 'FAILED', errorMessage: fcmError.message || String(fcmError) }
                            );
                        } catch (dbErr) {}
                    }
                }
            } else {
                // No tokens registered
                if (type === 'BROADCAST' && refId) {
                    try {
                        const BroadcastDelivery = (await import('@/models/BroadcastDelivery')).default;
                        await BroadcastDelivery.updateOne(
                            { broadcastId: refId, userId, channel: 'push' },
                            { status: 'FAILED', errorMessage: 'No FCM tokens registered for this user' }
                        );
                    } catch (dbErr) {}
                }
            }
        }

        // 5. Email Notification
        if (email || (type === 'SECURITY' && email !== false)) {
            try {
                await sendEmail({
                    to: user.email,
                    subject: title,
                    body: message,
                    title: title
                });
                console.log(`[EMAIL] Sent to ${user.email}`);

                if (type === 'BROADCAST' && refId) {
                    try {
                        const BroadcastDelivery = (await import('@/models/BroadcastDelivery')).default;
                        await BroadcastDelivery.updateOne(
                            { broadcastId: refId, userId, channel: 'email' },
                            { status: 'SENT', sentAt: new Date() }
                        );
                    } catch (dbErr) {}
                }
            } catch (emailErr: any) {
                console.error('[EMAIL] Failed to send:', emailErr);
                if (type === 'BROADCAST' && refId) {
                    try {
                        const BroadcastDelivery = (await import('@/models/BroadcastDelivery')).default;
                        await BroadcastDelivery.updateOne(
                            { broadcastId: refId, userId, channel: 'email' },
                            { status: 'FAILED', errorMessage: emailErr.message || String(emailErr) }
                        );
                    } catch (dbErr) {}
                }
            }
        }

    } catch (error) {
        console.error('Error sending notification:', error);
    }
}
