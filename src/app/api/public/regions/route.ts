import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Region from '@/models/Region';

export async function GET() {
    try {
        await dbConnect();

        // Fetch only enabled regions
        const regions = await Region.find({ enabled: true })
            .select('countryName countryCode currencyCode phonePrefix defaultForNewUsers')
            .sort({ countryName: 1 });

        return NextResponse.json({
            success: true,
            regions: regions.map(r => ({
                id: r._id,
                countryName: r.countryName,
                countryCode: r.countryCode,
                dialCode: r.phonePrefix,
                defaultCurrency: r.currencyCode,
                supportedCurrencies: [r.currencyCode, 'USDT'], // USDT is globally supported
                isDefault: r.defaultForNewUsers || false
            }))
        });
    } catch (error: any) {
        console.error('Public Regions API Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to load regions'
        }, { status: 500 });
    }
}
