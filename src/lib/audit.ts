import AdminLog from '@/models/AdminLog';
import dbConnect from './mongodb';

export interface LogEntry {
    actorId: string;
    actorName: string;
    actorRole: string;
    actorType?: 'ADMIN' | 'SYSTEM';
    actionType: string;
    targetType: string;
    targetId?: string;
    details?: any;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
}

export async function logAdminAction(
    params: LogEntry | string, // Support both new object and legacy adminId for backward compatibility
    action?: string,
    targetType?: string,
    targetId?: string,
    details?: any,
    ipAddress?: string
) {
    try {
        await dbConnect();

        let logData: any;

        if (typeof params === 'object') {
            logData = {
                ...params,
                timestamp: new Date()
            };
        } else {
            // Legacy support
            logData = {
                actorId: params,
                actorName: 'Unknown', // We won't have this in legacy calls unless we fetch it
                actorRole: 'Unknown',
                actionType: action,
                targetType: targetType,
                targetId: targetId,
                details: typeof details === 'string' ? { message: details } : details,
                ipAddress: ipAddress || 'Unknown',
                timestamp: new Date()
            };
        }

        await AdminLog.create(logData);
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}
