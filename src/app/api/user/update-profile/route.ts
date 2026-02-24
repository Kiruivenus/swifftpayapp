import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { username, phone } = await req.json();
        await dbConnect();

        const updateData: any = {};
        if (username) updateData.username = username;
        if (phone) updateData.phoneNumber = phone;

        const updatedUser = await User.findByIdAndUpdate(user.id, updateData, { new: true });

        return NextResponse.json({
            message: 'Profile updated successfully',
            username: updatedUser.username,
            phone: updatedUser.phoneNumber
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
