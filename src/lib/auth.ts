import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    id: string;
    email: string;
    role: 'user' | 'super_admin' | 'admin' | 'finance' | 'kyc_reviewer' | 'support';
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
    // 1. Check Cookies (Common for Admin Portal)
    const cookieToken = req.cookies.get('token')?.value;

    // 2. Check Authorization Header (Standard for Mobile API)
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    const token = cookieToken || headerToken;

    if (!token) {
        return null;
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret'
        ) as AuthUser;
        return decoded;
    } catch (error) {
        return null;
    }
}
