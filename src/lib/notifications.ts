import User from '@/models/User';
import NotificationToken from '@/models/NotificationToken';

export async function sendPushNotification(
    userId: string,
    title: string,
    body: string,
    type: 'transactions' | 'security' | 'promotions'
) {
    try {
        const user = await User.findById(userId).select('notificationPrefs');
        if (!user) return;

        const prefs = user.notificationPrefs;
        if (!prefs.enabled) return;

        // Check category preference
        if (type === 'transactions' && !prefs.transactions) return;
        if (type === 'security' && !prefs.security) return;
        if (type === 'promotions' && !prefs.promotions) return;

        const tokens = await NotificationToken.find({ userId });
        if (tokens.length === 0) return;

        // In a real production app, you would use firebase-admin:
        // admin.messaging().sendEachForMulticast({ tokens: tokens.map(t => t.fcmToken), notification: { title, body } })

        console.log(`[PUSH] To User ${userId} (${type}): ${title} - ${body}`);
        tokens.forEach(t => {
            console.log(`[PUSH] Target Device: ${t.deviceId}, Token: ${t.fcmToken.take(10)}... (Platform: ${t.platform})`);
        });

    } catch (error) {
        console.error('Error sending push notification:', error);
    }
}
