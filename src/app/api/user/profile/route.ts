import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const dbUser = await User.findById(user.id).select('username fullName email phoneNumber dob isPinSet biometricEnabled kycStatus kycRejectionReason nationalityCode nationalityName residentialAddress profilePhotoUrl');
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: dbUser._id,
            username: dbUser.username,
            fullName: dbUser.fullName,
            email: dbUser.email,
            phone: dbUser.phoneNumber,
            dob: dbUser.dob ? dbUser.dob.toISOString().split('T')[0] : null,
            isPinSet: dbUser.isPinSet || false,
            biometricEnabled: dbUser.biometricEnabled || false,
            kycStatus: dbUser.kycStatus || 'NOT_STARTED',
            kycRejectionReason: dbUser.kycRejectionReason,
            nationalityCode: dbUser.nationalityCode,
            nationalityName: dbUser.nationalityName,
            residentialAddress: dbUser.residentialAddress,
            profilePhotoUrl: dbUser.profilePhotoUrl
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
