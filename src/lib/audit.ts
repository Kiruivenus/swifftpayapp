import AdminLog from '@/models/AdminLog';
import dbConnect from './mongodb';

export async function logAdminAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    details: string,
    ipAddress?: string
) {
    try {
        await dbConnect();
        await AdminLog.create({
            adminId,
            action,
            targetType,
            targetId,
            details,
            ipAddress: ipAddress || 'Unknown',
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}
