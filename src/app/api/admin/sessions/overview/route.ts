import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import SecurityEvent from '@/models/SecurityEvent';
import SecurityPolicy from '@/models/SecurityPolicy';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.VIEW_SESSIONS);
    if (error) return error;

    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const q = searchParams.get('q');
        const type = searchParams.get('type');
        const status = searchParams.get('status') || 'active';

        // Filters
        const query: any = { status };
        if (userId) query.userId = userId;
        if (type) query.sessionType = type;

        // Advanced search if q provided
        if (q) {
            const users = await User.find({
                $or: [
                    { email: { $regex: q, $options: 'i' } },
                    { username: { $regex: q, $options: 'i' } },
                    { phone: { $regex: q, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);
            query.$or = [
                { userId: { $in: userIds } },
                { ip: { $regex: q, $options: 'i' } },
                { deviceName: { $regex: q, $options: 'i' } }
            ];
        }

        // 1. Get Sessions
        const allSessions = await Session.find(query)
            .sort({ lastSeenAt: -1 })
            .populate('userId', 'username email role phone')
            .limit(100);

        const webSessions = allSessions.filter(s => s.sessionType === 'web');
        const mobileSessions = allSessions.filter(s => s.sessionType === 'mobile');

        // 2. Security Pulse (Simplified aggregation)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [failedLogins, newDevices, passwordResets] = await Promise.all([
            SecurityEvent.countDocuments({ type: 'FAILED_LOGIN', createdAt: { $gte: dayAgo } }),
            SecurityEvent.countDocuments({ type: 'NEW_DEVICE', createdAt: { $gte: weekAgo } }),
            SecurityEvent.countDocuments({ type: 'PASSWORD_RESET', createdAt: { $gte: weekAgo } })
        ]);

        // 3. Recent Alerts
        const recentAlerts = await SecurityEvent.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'username email');

        // 4. Policies
        const policies = await (SecurityPolicy as any).getSettings();

        return NextResponse.json({
            success: true,
            webSessions,
            mobileSessions,
            securityPulse: {
                failedLoginAttempts24h: failedLogins,
                newTrustedDevices7d: newDevices,
                passwordResets7d: passwordResets
            },
            recentSecurityAlerts: recentAlerts,
            policies
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
