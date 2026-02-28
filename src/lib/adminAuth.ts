import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from './auth';
import { hasPermission, isAdmin } from './rbac';

export async function validateAdmin(req: NextRequest, permission?: string) {
    const user = await verifyAuth(req);

    if (!user) {
        return { error: NextResponse.json({ message: 'Unauthorized. Please log in again.' }, { status: 401 }), user: null };
    }

    if (!isAdmin(user.role)) {
        return { error: NextResponse.json({ message: 'Forbidden. Admin access required.' }, { status: 403 }), user: null };
    }

    if (permission && !hasPermission(user.role, permission)) {
        return { error: NextResponse.json({ message: 'Insufficient permissions for this action.' }, { status: 403 }), user: null };
    }

    return { error: null, user };
}
