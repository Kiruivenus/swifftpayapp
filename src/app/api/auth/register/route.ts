import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import BlockedUser from '@/models/BlockedUser';
import Otp from '@/models/Otp';
import Region from '@/models/Region';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { username, email, phone, password, countryCode, currency, inviteCode } = await request.json();

        if (!email || !username || !phone || !password || !countryCode || !currency) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ message: 'Password must be at least 8 characters long' }, { status: 400 });
        }

        // Normalize email and username
        const emailNormalized = email.trim().toLowerCase();
        const usernameNormalized = username.trim().toLowerCase();

        // 1. Validate Region and Currency
        const region = await Region.findOne({ countryCode, enabled: true });
        if (!region) {
            return NextResponse.json({ message: 'Selected region is not supported or maintenance is active' }, { status: 400 });
        }

        if (region.currencyCode !== currency && currency !== 'USDT') {
            return NextResponse.json({ message: `Currency ${currency} is not supported for ${region.countryName}` }, { status: 400 });
        }

        // 2. Format Phone to E.164
        const phoneE164 = region.phonePrefix + phone.replace(/^0+/, '');

        // 3. Check for existing users using normalized fields
        const existingEmail = await User.findOne({ emailNormalized });
        if (existingEmail) {
            return NextResponse.json({
                message: 'This email is already registered.',
                errorCode: 'EMAIL_TAKEN'
            }, { status: 400 });
        }

        const existingUsername = await User.findOne({ usernameNormalized });
        if (existingUsername) {
            return NextResponse.json({
                message: 'That username is unavailable.',
                errorCode: 'USERNAME_TAKEN'
            }, { status: 400 });
        }

        const existingPhone = await User.findOne({ phoneE164 });
        if (existingPhone) {
            return NextResponse.json({
                message: 'This phone number is already in use.',
                errorCode: 'PHONE_TAKEN'
            }, { status: 400 });
        }

        // 4. Check if identifier is blocked
        const isBlocked = await BlockedUser.findOne({
            $or: [
                { email: emailNormalized },
                { username: usernameNormalized },
                { phone: phoneE164 }
            ]
        });
        if (isBlocked) {
            return NextResponse.json({ message: 'This account identifier cannot be used to register again.' }, { status: 403 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check inviteCode / referrer
        let referredByUserId = null;
        if (inviteCode) {
            const referrer = await User.findOne({ referralCode: inviteCode.trim().toUpperCase() });
            if (referrer) {
                referredByUserId = referrer._id;
            }
        }

        // Create new user
        const newUser = await User.create({
            username,
            usernameNormalized,
            email,
            emailNormalized,
            phoneNumber: phone,
            phoneE164,
            password: hashedPassword,
            countryCode,
            currency,
            referredBy: referredByUserId,
            role: 'user', // Default role is 'user' (lowercase as per schema)
            kesBalance: 0,
            usdtBalance: 0,
            status: 'PENDING_VERIFICATION',
            emailVerified: false,
            email2FAEnabled: true,
            biometricEnabled: false,
            notificationPrefs: {
                enabled: true,
                transactions: true,
                security: true,
                promotions: false
            }
        });

        // Create pending referral record if referred
        if (referredByUserId) {
            const Referral = (await import('@/models/Referral')).default;
            await Referral.create({
                referrerId: referredByUserId,
                referredUserId: newUser._id,
                status: 'PENDING',
                cardSpent: false,
                deposited: false
            });
        }

        // Generate Verification OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await Otp.create({
            identifier: emailNormalized,
            code,
            type: 'EMAIL_VERIFICATION',
            expiresAt
        });

        // Send Email
        try {
            await sendEmail({
                to: email,
                subject: 'Verify your email - SwiftPay',
                title: 'Welcome to SwiftPay!',
                body: `Thank you for joining SwiftPay. To complete your registration and secure your account, please use the 6-digit verification code below.`,
                code: code,
            });
        } catch (emailErr) {
            console.error('Failed to send welcome email:', emailErr);
            // We don't fail registration if email fails (they can resend), but it's logged
        }

        return NextResponse.json({
            ok: true,
            message: 'Registration successful. Please verify your email.',
            email: newUser.email,
            status: 'PENDING_VERIFICATION'
        });

    } catch (error: any) {
        console.error('Registration API Error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue || {})[0];
            let message = 'An account with this information already exists.';
            let errorCode = 'DUPLICATE_KEY';

            if (field === 'username' || field === 'usernameNormalized') {
                message = 'That username is unavailable.';
                errorCode = 'USERNAME_TAKEN';
            } else if (field === 'email' || field === 'emailNormalized') {
                message = 'This email is already registered.';
                errorCode = 'EMAIL_TAKEN';
            } else if (field === 'phoneE164' || field === 'phoneNumber') {
                message = 'This phone number is already in use.';
                errorCode = 'PHONE_TAKEN';
            }

            return NextResponse.json({
                ok: false,
                message,
                errorCode
            }, { status: 400 });
        }

        return NextResponse.json({
            ok: false,
            message: 'An unexpected error occurred during registration.',
            code: 'SERVER_ERROR'
        }, { status: 500 });
    }
}
