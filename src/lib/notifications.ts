import User from '@/models/User';
import NotificationToken from '@/models/NotificationToken';
import UserNotification from '@/models/UserNotification';
import NotificationSettings from '@/models/NotificationSettings';

export type NotificationType = 'BROADCAST' | 'SYSTEM' | 'SECURITY' | 'FINANCE';

export async function sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    options: { push?: boolean; inApp?: boolean; email?: boolean; refId?: string } = { push: true, inApp: true }
) {
    try {
        // 1. Check Global Settings for automated alerts if it's not a broadcast
        if (type !== 'BROADCAST') {
            const settings = await (NotificationSettings as any).getSettings();
            if (type === 'SECURITY' && !settings.newLoginDetected) return;
            if (type === 'SYSTEM' && !settings.kycStatusUpdates) return;
            if (type === 'FINANCE') {
                // Could split further but keeping simple for now
                if (title.includes('Deposit') && !settings.depositSuccessful) return;
                if (title.includes('Withdrawal') && !settings.withdrawalProcessed) return;
            }
        }

        // 2. In-App Notification
        if (options.inApp) {
            await UserNotification.create({
                userId,
                title,
                message,
                type,
                refId: options.refId
            });
        }

        // 3. Push Notification
        if (options.push) {
            const tokens = await NotificationToken.find({ userId });
            if (tokens.length > 0) {
                // Real FCM call would go here
                console.log(`[PUSH] To User ${userId} (${type}): ${title} - ${message}`);
            }
        }

        // 4. Email (Placeholder)
        if (options.email) {
            console.log(`[EMAIL] To User ${userId}: ${title}`);
        }

    } catch (error) {
        console.error('Error sending notification:', error);
    }
}
