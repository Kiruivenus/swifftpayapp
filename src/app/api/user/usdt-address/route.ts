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

        await dbConnect();
        let dbUser = await User.findById(user.id);

        if (!dbUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        let UsdtDepositAddress;
        try {
            UsdtDepositAddress = (await import('@/models/UsdtDepositAddress')).default;
        } catch (e) {
            console.error('Failed to import UsdtDepositAddress model', e);
        }

        let isAddressValid = false;
        if (dbUser.usdtAddress && UsdtDepositAddress) {
            const poolAddress = await UsdtDepositAddress.findOne({ address: dbUser.usdtAddress, isActive: true });
            if (poolAddress) {
                isAddressValid = true;
            }
        }

        if (!isAddressValid) {
            const pool = UsdtDepositAddress ? await UsdtDepositAddress.find({ isActive: true }) : [];
            if (pool.length > 0) {
                const randomIndex = Math.floor(Math.random() * pool.length);
                dbUser.usdtAddress = pool[randomIndex].address;
                await dbUser.save();
            } else if (!dbUser.usdtAddress) {
                // Generate a mock TRC20 address if pool is empty and user has none
                const mockAddress = 'T' + Array.from({ length: 33 }, () => Math.random().toString(36).charAt(2)).join('');
                dbUser.usdtAddress = mockAddress;
                await dbUser.save();
            }
        }

        return NextResponse.json({ address: dbUser.usdtAddress });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
