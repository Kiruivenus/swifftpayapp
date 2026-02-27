import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { saveImage } from '@/lib/storage';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { image } = await req.json();
        if (!image) {
            return NextResponse.json({ message: 'No image provided' }, { status: 400 });
        }

        await dbConnect();

        const photoUrl = await saveImage(image, 'profiles');

        const updatedUser = await User.findByIdAndUpdate(
            user.id,
            { profilePhotoUrl: photoUrl },
            { new: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Profile photo updated successfully',
            profilePhotoUrl: updatedUser.profilePhotoUrl
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
