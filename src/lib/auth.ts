import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    id: string;
    email: string;
    role: 'user' | 'admin' | 'finance' | 'kyc_reviewer' | 'support';
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];
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
