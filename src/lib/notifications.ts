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
    options: { push?: boolean; inApp?: boolean; email?: boolean; refId?: string } = { push: true, inApp: true, email: true }
) {
    try {
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
        if (options.inApp) {
            await UserNotification.create({
                userId,
                title,
                message,
                type,
                refId: options.refId
            });
        }

        // 4. Push Notification
        if (options.push && prefs.enabled) {
            const tokens = await NotificationToken.find({ userId });
            if (tokens.length > 0) {
                const fcmTokens = tokens.map(t => t.fcmToken);
                const { fcm } = await import('./firebase-admin');

                try {
                    await fcm.sendEachForMulticast({
                        tokens: fcmTokens,
                        notification: {
                            title,
                            body: message,
                        },
                        data: {
                            type,
                            category: type === 'FINANCE' ? 'transactions' : 'alerts',
                            refId: options.refId || '',
                        },
                        android: {
                            priority: 'high',
                            notification: {
                                channelId: 'swiftpay_alerts',
                                // Using standard system icon as ic_stat_name is missing
                                icon: 'stock_incoming_call',
                                color: '#e11d48'
                            }
                        }
                    });
                    console.log(`[PUSH] Sent to user ${userId} (${fcmTokens.length} devices)`);
                } catch (fcmError) {
                    console.error('[PUSH] FCM error:', fcmError);
                }
            }
        }

        // 5. Email Notification
        if (options.email || (type === 'SECURITY' && options.email !== false)) {
            try {
                await sendEmail({
                    to: user.email,
                    subject: title,
                    body: message,
                    title: title
                });
                console.log(`[EMAIL] Sent to ${user.email}`);
            } catch (emailErr) {
                console.error('[EMAIL] Failed to send:', emailErr);
            }
        }

    } catch (error) {
        console.error('Error sending notification:', error);
    }
}
