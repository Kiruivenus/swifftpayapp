import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformSettings from '@/models/PlatformSettings';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const settings = await (PlatformSettings as any).getSettings();
        return NextResponse.json({
            usdtToKesRate: 128.5, 
            minDeposit: 50,
            transactionFeePercent: 1,
            referralEnabled: settings.referralEnabled ?? true,
            referralMinRewardUsd: settings.referralMinRewardUsd ?? 2.00,
            referralMaxRewardUsd: settings.referralMaxRewardUsd ?? 10.00
        });
    } catch (err: any) {
        return NextResponse.json({
            usdtToKesRate: 128.5,
            minDeposit: 50,
            transactionFeePercent: 1,
            referralEnabled: true,
            referralMinRewardUsd: 2.00,
            referralMaxRewardUsd: 10.00
        });
    }
}
