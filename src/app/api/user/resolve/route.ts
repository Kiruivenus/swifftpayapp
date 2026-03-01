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

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');
        const type = searchParams.get('type'); // "EMAIL" | "USER_ID"

        if (!query) {
            return NextResponse.json({ message: 'Missing query parameter' }, { status: 400 });
        }

        await dbConnect();

        let targetUser;
        if (type === 'EMAIL') {
            targetUser = await User.findOne({ emailNormalized: query.trim().toLowerCase() });
        } else {
            targetUser = await User.findById(query.trim());
        }

        if (!targetUser) {
            return NextResponse.json({ message: 'Recipient not found' }, { status: 404 });
        }

        if (targetUser._id.toString() === user.id) {
            return NextResponse.json({ message: 'You cannot transfer to yourself' }, { status: 400 });
        }

        return NextResponse.json({
            recipientId: targetUser._id,
            displayName: targetUser.fullName || targetUser.username || targetUser.email,
            email: targetUser.email,
            username: targetUser.username
        });
    } catch (error: any) {
        return NextResponse.json({ message: 'Invalid format or recipient not found' }, { status: 400 });
    }
}
