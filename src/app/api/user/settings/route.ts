import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(dbUser.userSettings || { hideBalances: false });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { hideBalances } = body;

        const dbUser = await User.findById(user.id);
        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        dbUser.userSettings = {
            ...dbUser.userSettings,
            hideBalances: hideBalances !== undefined ? hideBalances : dbUser.userSettings?.hideBalances
        };

        await dbUser.save();

        return NextResponse.json({ message: 'Settings updated successfully', settings: dbUser.userSettings });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
