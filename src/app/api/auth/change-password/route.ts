import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, dbUser.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Incorrect current password' }, { status: 401 });
        }

        // Password rules check (simple)
        if (newPassword.length < 8) {
            return NextResponse.json({ message: 'New password must be at least 8 characters' }, { status: 400 });
        }

        if (currentPassword === newPassword) {
            return NextResponse.json({ message: 'New password must be different from current' }, { status: 400 });
        }

        // Hash and save new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        dbUser.password = hashedPassword;
        await dbUser.save();

        return NextResponse.json({ message: 'Password updated successfully' });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
