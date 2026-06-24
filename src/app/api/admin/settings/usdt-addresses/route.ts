import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import UsdtDepositAddress from '@/models/UsdtDepositAddress';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        await dbConnect();
        
        const addresses = await UsdtDepositAddress.find().sort({ createdAt: -1 });

        // Calculate assigned users count dynamically for each address
        const addressesWithCounts = await Promise.all(
            addresses.map(async (item) => {
                const count = await User.countDocuments({ usdtAddress: item.address });
                return {
                    id: item._id.toString(),
                    address: item.address,
                    network: item.network,
                    isActive: item.isActive,
                    assignedUsersCount: count,
                    createdAt: item.createdAt,
                };
            })
        );

        return NextResponse.json(addressesWithCounts);
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        await dbConnect();
        const { address } = await req.json();

        if (!address || address.trim().length < 10) {
            return NextResponse.json({ message: 'Invalid USDT Address' }, { status: 400 });
        }

        const cleanAddress = address.trim();

        // Check if address already exists in the pool
        const existing = await UsdtDepositAddress.findOne({ address: cleanAddress });
        if (existing) {
            return NextResponse.json({ message: 'Address already exists in the pool' }, { status: 400 });
        }

        const newAddress = await UsdtDepositAddress.create({
            address: cleanAddress,
            network: 'TRC20',
            isActive: true,
        });

        return NextResponse.json({ success: true, data: newAddress });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        await dbConnect();
        const id = req.nextUrl.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'Missing address ID parameter' }, { status: 400 });
        }

        const addressDoc = await UsdtDepositAddress.findById(id);
        if (!addressDoc) {
            return NextResponse.json({ message: 'USDT Address not found in the pool' }, { status: 404 });
        }

        const deletedAddress = addressDoc.address;

        // Delete from the pool
        await UsdtDepositAddress.findByIdAndDelete(id);

        // Disassociate this address from all users who were assigned to it
        // Their next request to /api/user/usdt-address will automatically assign a new address
        await User.updateMany(
            { usdtAddress: deletedAddress },
            { $unset: { usdtAddress: 1 } }
        );

        return NextResponse.json({ success: true, message: 'Address successfully removed. Affected users will be reassigned.' });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
