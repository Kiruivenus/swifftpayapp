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
        const query = searchParams.get('query') || '';

        if (!query.trim()) {
            return NextResponse.json([]);
        }

        await dbConnect();

        const searchRegex = new RegExp(query.trim(), 'i');
        const matchedUsers = await User.find({
            _id: { $ne: user.id },
            isDeleted: { $ne: true },
            $or: [
                { email: searchRegex },
                { username: searchRegex },
                { fullName: searchRegex }
            ]
        })
        .limit(10)
        .select('_id fullName email username profilePhotoUrl kycStatus');

        const results = matchedUsers.map(u => ({
            recipientId: u._id.toString(),
            displayName: u.fullName || u.username || u.email,
            email: u.email,
            username: u.username ? `@${u.username.replace(/^@/, '')}` : '',
            profilePhotoUrl: u.profilePhotoUrl || null,
            isVerified: u.kycStatus === 'APPROVED'
        }));

        return NextResponse.json(results);
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'Search failed' }, { status: 400 });
    }
}
