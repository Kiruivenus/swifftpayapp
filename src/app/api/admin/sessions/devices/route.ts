import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TrustedDevice from '@/models/TrustedDevice';
import Session from '@/models/Session';
import SecurityEvent from '@/models/SecurityEvent';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.VIEW_SESSIONS);
    if (error) return error;

    try {
        await dbConnect();
        const devices = await TrustedDevice.find()
            .sort({ lastUsedAt: -1 })
            .populate('userId', 'username email');
            
        return NextResponse.json({ success: true, devices });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_SESSIONS);
    if (error) return error;

    try {
        const body = await req.json();
        const { deviceId, userId, action, newName } = body;

        if (!deviceId || !userId) {
            return NextResponse.json({ success: false, message: 'Device ID and User ID are required.' }, { status: 400 });
        }

        await dbConnect();
        const device = await TrustedDevice.findOne({ deviceId, userId });

        if (!device) {
            return NextResponse.json({ success: false, message: 'Device record not found.' }, { status: 404 });
        }

        const before = JSON.parse(JSON.stringify(device));
        let message = '';

        if (action === 'RENAME') {
            if (!newName) return NextResponse.json({ success: false, message: 'New name is required' }, { status: 400 });
            device.deviceName = newName;
            message = `Renamed device to "${newName}"`;
        } else if (action === 'BLOCK') {
            device.isBlocked = true;
            device.riskScore = 95; // Escalate risk score to high
            message = `Blocked device fingerprint: ${deviceId}`;
            
            // Revoke active sessions for this device
            await Session.updateMany(
                { userId, deviceId, status: 'active' },
                { $set: { status: 'revoked', revokedAt: new Date() } }
            );

            // Log security warning
            await SecurityEvent.create({
                type: 'SENSITIVE_ACTION',
                severity: 'high',
                userId,
                adminId: admin.id,
                message: `Device ${deviceId} blocked by admin. Active sessions terminated.`
            });
        } else if (action === 'UNBLOCK') {
            device.isBlocked = false;
            device.riskScore = 10; // Reset risk score
            message = `Unblocked device fingerprint: ${deviceId}`;
        } else if (action === 'TRUST') {
            device.revokedAt = null;
            message = `Trusted device: ${deviceId}`;
            
            // Mark associated active sessions as trusted
            await Session.updateMany({ userId, deviceId }, { $set: { isTrusted: true, trustedAt: new Date(), trustedBy: admin.id } });
        } else if (action === 'UNTRUST') {
            device.revokedAt = new Date();
            message = `Untrusted device: ${deviceId}`;
            
            // Untrust associated active sessions
            await Session.updateMany({ userId, deviceId }, { $set: { isTrusted: false, trustedAt: null, trustedBy: null } });
        } else {
            return NextResponse.json({ success: false, message: 'Invalid action specified.' }, { status: 400 });
        }

        await device.save();

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'MANAGE_DEVICE_FIREWALL',
            targetType: 'USER',
            targetId: userId,
            details: { action, deviceId, before, after: device },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown'
        });

        return NextResponse.json({ success: true, message, device });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.MANAGE_SESSIONS);
    if (error) return error;

    try {
        const { searchParams } = new URL(req.url);
        const deviceId = searchParams.get('deviceId');
        const userId = searchParams.get('userId');

        if (!deviceId || !userId) {
            return NextResponse.json({ success: false, message: 'Device ID and User ID are required.' }, { status: 400 });
        }

        await dbConnect();
        const deleted = await TrustedDevice.findOneAndDelete({ deviceId, userId });

        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Device not found' }, { status: 404 });
        }

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'DELETE_DEVICE_REGISTRY',
            targetType: 'USER',
            targetId: userId,
            details: { deviceId },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown'
        });

        return NextResponse.json({ success: true, message: 'Device removed from trusted registry.' });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
