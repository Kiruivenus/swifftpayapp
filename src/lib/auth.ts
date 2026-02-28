import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from './mongodb';
import Session from '@/models/Session';

export interface AuthUser {
    id: string;
    email: string;
    role: string;
    name?: string;
    is2faEnabled?: boolean;
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
    const cookieToken = req.cookies.get('token')?.value;
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    const token = cookieToken || headerToken;
    if (!token) return null;

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret'
        ) as any;

        // Session Integrity Check (Revocation Support)
        await dbConnect();

        // Find most recent active session for this user to verify status
        // A better approach would be to include sessionId in the JWT payload
        const activeSession = await Session.findOne({
            userId: decoded.id,
            status: 'active',
            expiresAt: { $gt: new Date() }
        });

        if (!activeSession) {
            return null;
        }

        // Return user with 2FA status for policy checks
        return {
            ...decoded,
            is2faEnabled: !!activeSession.isTrusted // Or fetch from User model if needed
        };
    } catch (error) {
        return null;
    }
}
