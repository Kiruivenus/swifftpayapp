import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Session from '@/models/Session';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const sessions = await Session.find({ userId: user.id }).sort({ lastActive: -1 });

        return NextResponse.json(sessions);
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

        const { sessionId, logoutAllOthers } = await req.json();

        if (logoutAllOthers) {
            // Get current token from request to keep current session
            const authHeader = req.headers.get('authorization');
            const currentToken = authHeader?.split(' ')[1];

            await Session.deleteMany({ userId: user.id, token: { $ne: currentToken } });
            return NextResponse.json({ message: 'Other sessions logged out' });
        }

        if (sessionId) {
            await Session.findByIdAndDelete(sessionId);
            return NextResponse.json({ message: 'Session logged out' });
        }

        return NextResponse.json({ message: 'No action specified' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
