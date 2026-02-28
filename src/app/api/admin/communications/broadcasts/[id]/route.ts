import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Broadcast from '@/models/Broadcast';
import BroadcastDelivery from '@/models/BroadcastDelivery';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        const { id } = await params;
        await dbConnect();

        const [broadcast, deliveryStats] = await Promise.all([
            Broadcast.findById(id).populate('createdByAdminId', 'name email'),
            BroadcastDelivery.aggregate([
                { $match: { broadcastId: new Object(id) } },
                {
                    $group: {
                        _id: '$channel',
                        sent: { $sum: { $cond: [{ $eq: ['$status', 'SENT'] }, 1, 0] } },
                        delivered: { $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] } },
                        failed: { $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] } },
                        opened: { $sum: { $cond: [{ $eq: ['$status', 'OPENED'] }, 1, 0] } }
                    }
                }
            ])
        ]);

        if (!broadcast) {
            return NextResponse.json({ success: false, message: 'Broadcast not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                broadcast,
                channelStats: deliveryStats
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
