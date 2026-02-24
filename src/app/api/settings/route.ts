import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    // For now, returning hardcoded settings. 
    // In a full implementation, these would come from a Settings model in MongoDB.
    return NextResponse.json({
        usdtToKesRate: 128.5, // Current market-like rate
        minDeposit: 50,
        transactionFeePercent: 1
    });
}
