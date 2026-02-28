import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth';
import { hasPermission, isAdmin } from './rbac';
import SecurityPolicy from '@/models/SecurityPolicy';
import SecurityEvent from '@/models/SecurityEvent';
import Session from '@/models/Session';
import { lookupIp } from './geo';

export async function validateAdmin(req: NextRequest, permission?: string) {
    const user = await verifyAuth(req);

    if (!user) {
        return {
            error: NextResponse.json({
                success: false,
                code: 'UNAUTHORIZED',
                message: 'Unauthorized. Please log in again.'
            }, { status: 401 }), user: null
        };
    }

    if (!isAdmin(user.role)) {
        return {
            error: NextResponse.json({
                success: false,
                code: 'FORBIDDEN',
                message: 'Forbidden. Admin access required.'
            }, { status: 403 }), user: null
        };
    }

    // 1. Check Global Security Policies
    const policy = await (SecurityPolicy as any).getSettings();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // A. IP Blocking
    if (policy.blockNonKenyanIps) {
        const geo = await lookupIp(ip);
        if (geo && !policy.allowedCountries.includes(geo.countryCode)) {
            // Log security event
            await SecurityEvent.create({
                type: 'SUSPICIOUS_LOGIN',
                severity: 'high',
                userId: user.id,
                ip,
                message: `Admin access denied from unauthorized region: ${geo.country} (${geo.countryCode})`,
                metadata: { geo }
            });

            return {
                error: NextResponse.json({
                    success: false,
                    code: 'REGION_BLOCKED',
                    message: `Access denied. Our current policy restricts admin access to specific regions.`
                }, { status: 403 }), user: null
            };
        }
    }

    // B. Mandatory 2FA Check
    if (policy.mandatory2faForAdmins && !user.is2faEnabled) {
        return {
            error: NextResponse.json({
                success: false,
                code: '2FA_REQUIRED',
                message: 'Mandatory 2FA is enabled for admins. Please enable 2FA in your security settings to proceed.'
            }, { status: 403 }), user: null
        };
    }

    // 2. Session Integrity Check
    // Get the sessionId from the JWT or look up the most recent active session for this user
    // Since verifyAuth returns user payload, we can check Session status in DB
    const activeSession = await Session.findOne({ userId: user.id, status: 'active' }).sort({ createdAt: -1 });
    if (!activeSession) {
        return {
            error: NextResponse.json({
                success: false,
                code: 'SESSION_REVOKED',
                message: 'Your session has been revoked or expired. Please log in again.'
            }, { status: 401 }), user: null
        };
    }

    // 3. Permission Check
    if (permission && !hasPermission(user.role, permission)) {
        return {
            error: NextResponse.json({
                success: false,
                code: 'INSUFFICIENT_PERMISSIONS',
                message: 'Insufficient permissions for this action.'
            }, { status: 403 }), user: null
        };
    }

    return { error: null, user };
}
