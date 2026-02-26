import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { verifyAuth } from '@/lib/auth';

// Simple mock for data export status
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host');
        const baseUrl = `${protocol}://${host}`;

        return NextResponse.json({
            status: 'READY',
            downloadUrl: `${baseUrl}/api/data/export/download`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
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

        return NextResponse.json({ message: 'Data export request submitted. You will be notified when it is ready.' });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
