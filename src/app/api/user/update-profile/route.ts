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

        const { username, fullName, phone, dob } = await req.json();
        await dbConnect();

        const updateData: any = {};
        if (username) updateData.username = username;
        if (fullName !== undefined) updateData.fullName = fullName;
        if (phone) updateData.phoneNumber = phone;
        if (dob) updateData.dob = new Date(dob);

        const updatedUser = await User.findByIdAndUpdate(user.id, updateData, { new: true });

        return NextResponse.json({
            message: 'Profile updated successfully',
            username: updatedUser.username,
            fullName: updatedUser.fullName,
            phone: updatedUser.phoneNumber,
            dob: updatedUser.dob ? updatedUser.dob.toISOString().split('T')[0] : null
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
