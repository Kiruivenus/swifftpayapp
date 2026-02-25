import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import BlockedUser from '@/models/BlockedUser';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { confirmText, password } = await req.json();

        if (confirmText !== 'DELETE') {
            return NextResponse.json({ message: 'Please type DELETE to confirm' }, { status: 400 });
        }

        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Verify password for extra security
        const isMatch = await bcrypt.compare(password, dbUser.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Incorrect password' }, { status: 401 });
        }

        // Add identifiers to BlockedUser
        await BlockedUser.create({
            email: dbUser.email,
            phone: dbUser.phoneNumber,
            username: dbUser.username,
            reason: 'ACCOUNT_DELETED'
        });

        // Soft delete user
        dbUser.isDeleted = true;
        dbUser.deletedAt = new Date();
        // Clear sensitive info
        dbUser.email = `deleted_${dbUser._id}@deleted.com`;
        dbUser.phoneNumber = `deleted_${dbUser._id}`;
        dbUser.username = `deleted_${dbUser._id}`;

        await dbUser.save();

        return NextResponse.json({ message: 'Account deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
