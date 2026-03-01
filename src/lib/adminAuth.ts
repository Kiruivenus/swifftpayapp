import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth';
import { hasPermission, isAdmin, Role } from './rbac';
import dbConnect from './mongodb';
import SecurityPolicy from '@/models/SecurityPolicy';
import SecurityEvent from '@/models/SecurityEvent';
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

    if (!isAdmin(user.role as Role)) {
        return {
            error: NextResponse.json({
                success: false,
                code: 'FORBIDDEN',
                message: 'Forbidden. Admin access required.'
            }, { status: 403 }), user: null
        };
    }

    // Connect to DB before any Mongoose queries
    await dbConnect();

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

    // 3. Permission Check
    if (permission && !hasPermission(user.role as Role, permission)) {
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
