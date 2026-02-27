import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import KycRequest from '@/models/KycRequest';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import { saveImage } from '@/lib/storage';

export async function POST(req: NextRequest) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { documentType, documentNumber, frontImage, backImage, selfieImage } = body;

        await dbConnect();

        // 1. Check if user already has a pending or approved KYC
        const existingRequest = await KycRequest.findOne({
            userId: user.id,
            status: { $in: ['PENDING', 'APPROVED'] }
        });

        if (existingRequest) {
            return NextResponse.json({
                message: existingRequest.status === 'APPROVED' ? 'You are already verified' : 'KYC is already under review'
            }, { status: 400 });
        }

        // 2. Save images
        const frontImageUrl = await saveImage(frontImage, 'kyc/front');
        let backImageUrl = null;
        if (backImage) {
            backImageUrl = await saveImage(backImage, 'kyc/back');
        }
        const selfieImageUrl = await saveImage(selfieImage, 'kyc/selfie');

        // 3. Create KYC Request
        const kycReq = await KycRequest.create({
            userId: user.id,
            fullName: user.fullName,
            dob: user.dob,
            nationality: user.nationalityName,
            documentType,
            documentNumber,
            frontImageUrl,
            backImageUrl,
            selfieImageUrl,
            status: 'PENDING'
        });

        // 4. Update user kycStatus
        await User.findByIdAndUpdate(user.id, { kycStatus: 'PENDING' });

        return NextResponse.json({
            success: true,
            message: 'KYC submitted successfully',
            kycStatus: 'PENDING'
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
