import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import SecurityEvent from '@/models/SecurityEvent';
import SecurityPolicy from '@/models/SecurityPolicy';
import User from '@/models/User';
import TrustedDevice from '@/models/TrustedDevice';
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
            .populate('userId', 'username email role phone status')
            .limit(100);

        const webSessions = allSessions.filter(s => s.sessionType === 'web');
        const mobileSessions = allSessions.filter(s => s.sessionType === 'mobile');

        // Geolocations mapping for map visualizer
        const geoLocations = allSessions
            .filter(s => s.status === 'active' && s.geo && (s.geo.lat || s.geo.country))
            .map(s => ({
                userId: s.userId?._id,
                username: (s.userId as any)?.username || 'Unknown',
                ip: s.ip || 'Unknown IP',
                city: s.geo.city || 'Nairobi',
                country: s.geo.country || 'KE',
                lat: s.geo.lat || -1.2921, // Default to Nairobi if coordinates are blank
                lon: s.geo.lon || 36.8219,
                isTrusted: s.isTrusted
            }));

        // 2. Security Pulse Metrics
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            activeSessionsCount,
            activeDevicesCount,
            failedLoginsToday,
            suspiciousActivitiesToday,
            lockedAccountsCount,
            passwordResetsWeek,
            newDevicesWeek,
            securityIncidentsCount
        ] = await Promise.all([
            Session.countDocuments({ status: 'active' }),
            TrustedDevice.countDocuments({ revokedAt: null, isBlocked: { $ne: true } }),
            SecurityEvent.countDocuments({ type: 'FAILED_LOGIN', createdAt: { $gte: dayAgo } }),
            SecurityEvent.countDocuments({ 
                type: { $in: ['SUSPICIOUS_LOGIN', 'SUSPICIOUS_WITHDRAW', 'EMERGENCY_LOCK'] }, 
                createdAt: { $gte: dayAgo } 
            }),
            User.countDocuments({ status: 'BLOCKED' }),
            SecurityEvent.countDocuments({ type: 'PASSWORD_RESET', createdAt: { $gte: weekAgo } }),
            SecurityEvent.countDocuments({ type: 'NEW_DEVICE', createdAt: { $gte: weekAgo } }),
            SecurityEvent.countDocuments({ status: { $in: ['NEW', 'INVESTIGATING'] }, severity: { $in: ['medium', 'high'] } })
        ]);

        // Online users: unique active user counts
        const onlineUsersCount = await Session.distinct('userId', { status: 'active' }).then(users => users.length);

        // 3. Recent Alerts
        const recentAlerts = await SecurityEvent.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('userId', 'username email');

        // 4. Policies
        const policies = await (SecurityPolicy as any).getSettings();

        return NextResponse.json({
            success: true,
            webSessions,
            mobileSessions,
            geoLocations,
            securityPulse: {
                activeSessions: activeSessionsCount,
                activeDevices: activeDevicesCount,
                failedLoginsToday,
                suspiciousActivities: suspiciousActivitiesToday,
                lockedAccounts: lockedAccountsCount,
                passwordResets: passwordResetsWeek,
                newDevicesDetected: newDevicesWeek,
                securityIncidents: securityIncidentsCount,
                onlineUsers: onlineUsersCount
            },
            recentSecurityAlerts: recentAlerts,
            policies
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
