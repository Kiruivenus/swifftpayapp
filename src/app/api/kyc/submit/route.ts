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

        // Fetch full user profile to get fullName, dob, etc.
        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // 0. Ensure user has filled profile details (fullName, dob, nationality)
        if (!dbUser.fullName || !dbUser.dob || !dbUser.nationalityName) {
            return NextResponse.json({
                message: 'Please complete your profile (Full Name, Date of Birth, and Nationality) before submitting KYC.'
            }, { status: 400 });
        }

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

        // 1b. Check if document number is already used by another user (Duplicate Check)
        const duplicateDocument = await KycRequest.findOne({
            documentNumber,
            status: { $in: ['PENDING', 'APPROVED'] },
            userId: { $ne: user.id } // exclude self if they are resubmitting (though 1. handles that)
        });

        if (duplicateDocument) {
            return NextResponse.json({
                message: 'This document has already been used to verify an account.'
            }, { status: 400 });
        }

        // 2. Validate Images
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB

        const validateImage = (base64: string, name: string) => {
            if (!base64) return `${name} image is required`;

            // Approximate size from base64 (3/4 of string length)
            const size = base64.length * (3 / 4);
            if (size > MAX_SIZE) return `${name} image is too large (max 5MB)`;

            // Check mime type
            if (base64.startsWith('data:')) {
                const mime = base64.split(';')[0].split(':')[1];
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
                    return `${name} image format not supported. Use JPEG, PNG or WEBP.`;
                }
            }
            return null;
        };

        const frontError = validateImage(frontImage, 'Front document');
        if (frontError) return NextResponse.json({ message: frontError }, { status: 400 });

        if (documentType !== 'PASSPORT') {
            const backError = validateImage(backImage, 'Back document');
            if (backError) return NextResponse.json({ message: backError }, { status: 400 });
        }

        const selfieError = validateImage(selfieImage, 'Selfie');
        if (selfieError) return NextResponse.json({ message: selfieError }, { status: 400 });

        // 3. Save images to Cloudinary
        let frontImageUrl, backImageUrl, selfieImageUrl;
        try {
            frontImageUrl = await saveImage(frontImage, 'kyc/front');
            if (backImage && documentType !== 'PASSPORT') {
                backImageUrl = await saveImage(backImage, 'kyc/back');
            }
            selfieImageUrl = await saveImage(selfieImage, 'kyc/selfie');
        } catch (uploadError: any) {
            return NextResponse.json({ message: 'Image upload failed. Please try again.' }, { status: 500 });
        }

        // 4. Create KYC Request
        await KycRequest.create({
            userId: user.id,
            fullName: dbUser.fullName,
            dob: dbUser.dob,
            nationality: dbUser.nationalityName,
            documentType,
            documentNumber,
            frontImageUrl,
            backImageUrl,
            selfieImageUrl,
            status: 'PENDING'
        });

        // 5. Update user kycStatus
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
