import mongoose from 'mongoose';
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
        const cleanQuery = query.trim();
        const lowerQuery = cleanQuery.toLowerCase();

        if (type === 'EMAIL') {
            targetUser = await User.findOne({ emailNormalized: lowerQuery });
        } else if (type === 'USERNAME') {
            const cleanUsername = lowerQuery.replace(/^@/, '');
            targetUser = await User.findOne({ usernameNormalized: cleanUsername });
        } else if (type === 'USER_ID') {
            if (mongoose.Types.ObjectId.isValid(cleanQuery)) {
                targetUser = await User.findById(cleanQuery);
            }
            if (!targetUser) {
                // Fallback: check if username was passed as USER_ID
                const cleanUsername = lowerQuery.replace(/^@/, '');
                targetUser = await User.findOne({ usernameNormalized: cleanUsername });
            }
            if (!targetUser) {
                // Fallback: check if email was passed as USER_ID
                targetUser = await User.findOne({ emailNormalized: lowerQuery });
            }
        } else {
            if (mongoose.Types.ObjectId.isValid(cleanQuery)) {
                targetUser = await User.findById(cleanQuery);
            }
            if (!targetUser) {
                const cleanUsername = lowerQuery.replace(/^@/, '');
                targetUser = await User.findOne({
                    $or: [
                        { emailNormalized: lowerQuery },
                        { usernameNormalized: cleanUsername }
                    ]
                });
            }
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
