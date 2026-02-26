import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import BlockedUser from '@/models/BlockedUser';
import Otp from '@/models/Otp';
import Country from '@/models/Country';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
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

        // 1. Validate Country and Currency
        const country = await Country.findOne({ countryCode, isActive: true });
        if (!country) {
            return NextResponse.json({ message: 'Selected country is not supported or inactive' }, { status: 400 });
        }

        if (!country.allowedCurrencies.includes(currency)) {
            return NextResponse.json({ message: `Currency ${currency} is not allowed for ${country.countryName}` }, { status: 400 });
        }

        // 2. Format Phone to E.164
        const phoneE164 = country.phoneCode + phone.replace(/^0+/, '');

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

        // Create new user
        const newUser = await User.create({
            username,
            usernameNormalized,
            email,
            emailNormalized,
            phoneNumber: phone, // Original for display if needed
            phoneE164,
            password: hashedPassword,
            countryCode,
            currency,
            inviteCode,
            role: 'USER',
            kesBalance: 0,
            usdtBalance: 0,
            status: 'PENDING_VERIFICATION',
            emailVerified: false,
            biometricEnabled: false,
            notificationPrefs: {
                enabled: false,
                transactions: false,
                security: false,
                promotions: false
            }
        });

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
        await sendEmail({
            to: email,
            subject: 'Verify your email - SwiftPay',
            title: 'Welcome to SwiftPay!',
            body: `Thank you for joining SwiftPay. To complete your registration and secure your account, please use the 6-digit verification code below.`,
            code: code,
        });

        return NextResponse.json({
            message: 'Registration successful. Please verify your email.',
            email: newUser.email,
            status: 'PENDING_VERIFICATION'
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
