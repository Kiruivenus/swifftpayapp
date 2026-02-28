import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import KycRequest from '@/models/KycRequest';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.REVIEW_KYC);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    try {
        await dbConnect();

        const query: any = { status };

        const [requests, total] = await Promise.all([
            KycRequest.find(query)
                .populate('userId', 'username email fullName profilePhotoUrl')
                .sort({ submittedAt: 1 }) // First in, first out for queue
                .skip(skip)
                .limit(limit),
            KycRequest.countDocuments(query)
        ]);

        return NextResponse.json({
            requests,
            total,
            pages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
