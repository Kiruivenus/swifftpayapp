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

        const { username, fullName, phone, dob, nationalityCode, nationalityName, residentialAddress } = await req.json();
        await dbConnect();

        // Fetch full user record to check current data and kycStatus
        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // 1. Check KYC Status Restriction
        if (dbUser.kycStatus === 'PENDING' || dbUser.kycStatus === 'APPROVED') {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'PROFILE_LOCKED',
                    message: 'Profile cannot be edited after KYC submission.'
                }
            }, { status: 400 });
        }

        const updateData: any = {};

        // 2. Uniqueness Validations (if changed)
        if (username && username !== dbUser.username) {
            const usernameNormalized = username.trim().toLowerCase();
            const existingUser = await User.findOne({ usernameNormalized });
            if (existingUser) {
                return NextResponse.json({ message: 'Username already taken' }, { status: 400 });
            }
            updateData.username = username;
            updateData.usernameNormalized = usernameNormalized;
        }

        if (phone && phone !== dbUser.phoneNumber) {
            // Basic check for phone uniqueness (should ideally be more robust E164 check)
            const existingPhone = await User.findOne({ phoneNumber: phone });
            if (existingPhone) {
                return NextResponse.json({ message: 'Phone number already registered' }, { status: 400 });
            }
            updateData.phoneNumber = phone;
            updateData.phoneE164 = phone; // Assuming simple normalization for now if not already handled
        }

        if (fullName !== undefined) updateData.fullName = fullName;
        if (dob) updateData.dob = new Date(dob);
        if (nationalityCode) updateData.nationalityCode = nationalityCode;
        if (nationalityName) updateData.nationalityName = nationalityName;
        if (residentialAddress) updateData.residentialAddress = residentialAddress.trim();

        const updatedUser = await User.findByIdAndUpdate(user.id, updateData, { new: true });

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            profile: {
                username: updatedUser.username,
                fullName: updatedUser.fullName,
                phone: updatedUser.phoneNumber,
                dob: updatedUser.dob ? updatedUser.dob.toISOString().split('T')[0] : null,
                nationalityCode: updatedUser.nationalityCode,
                nationalityName: updatedUser.nationalityName,
                residentialAddress: updatedUser.residentialAddress,
                kycStatus: updatedUser.kycStatus
            }
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
