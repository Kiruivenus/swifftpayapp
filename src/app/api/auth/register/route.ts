import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import BlockedUser from '@/models/BlockedUser';

export async function POST(request: Request) {
    try {
        await dbConnect();
        const { username, email, phone, password } = await request.json();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        // Check if identifier is blocked (from deleted account)
        const isBlocked = await BlockedUser.findOne({
            $or: [{ email }, { phone }]
        });
        if (isBlocked) {
            return NextResponse.json({ message: 'This email or phone number cannot be used to register again.' }, { status: 403 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await User.create({
            username,
            email,
            phoneNumber: phone,
            password: hashedPassword,
            role: 'USER',
            kesBalance: 0,
            usdtBalance: 0
        });

        // Create token
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1d' }
        );

        return NextResponse.json({
            token,
            role: newUser.role,
            username: newUser.username
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
