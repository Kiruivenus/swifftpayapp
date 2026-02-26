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

        const authHeader = req.headers.get('authorization');
        const currentToken = authHeader?.split(' ')[1];

        const sessions = await Session.find({
            userId: user.id,
            isActive: true
        }).sort({ lastActive: -1 });

        const mappedSessions = sessions.map(s => ({
            ...s.toObject(),
            isCurrentSession: s.token === currentToken
        }));

        return NextResponse.json(mappedSessions);
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

        const { sessionId, logoutAllOthers, logoutAll } = await req.json();

        // Get current token from request
        const authHeader = req.headers.get('authorization');
        const currentToken = authHeader?.split(' ')[1];

        if (logoutAll) {
            await Session.updateMany(
                { userId: user.id },
                { isActive: false, revokedAt: new Date() }
            );
            return NextResponse.json({ message: 'Logged out from all devices' });
        }

        if (logoutAllOthers) {
            await Session.updateMany(
                { userId: user.id, token: { $ne: currentToken } },
                { isActive: false, revokedAt: new Date() }
            );
            return NextResponse.json({ message: 'Other sessions logged out' });
        }

        if (sessionId) {
            await Session.findOneAndUpdate(
                { _id: sessionId, userId: user.id },
                { isActive: false, revokedAt: new Date() }
            );
            return NextResponse.json({ message: 'Session logged out' });
        }

        return NextResponse.json({ message: 'No action specified' }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
