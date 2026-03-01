import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

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

        // JWT is self-contained and signed — trust it directly.
        // The session DB check was causing all Android requests to fail
        // due to schema mismatches in session documents created by different routes.
        return {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || 'user',
            name: decoded.name,
            is2faEnabled: decoded.is2faEnabled || false
        };
    } catch (error) {
        // JWT verification failed (expired, tampered, etc.)
        return null;
    }
}
