import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Region from '@/models/Region';

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Seed Kenya if it doesn't exist
        const kenya = await Region.findOne({ countryCode: 'KE' });
        if (!kenya) {
            await Region.create({
                countryName: 'Kenya',
                countryCode: 'KE',
                currencyCode: 'KES',
                phonePrefix: '+254',
                enabled: true,
                defaultForNewUsers: true
            });
        }

        const regions = await Region.find({ enabled: true }).sort({ countryName: 1 });

        // Transform to match Android CountryResponse model
        const formattedRegions = regions.map(r => ({
            _id: r._id,
            countryName: r.countryName,
            countryCode: r.countryCode,
            phoneCode: r.phonePrefix || '',
            allowedCurrencies: [r.currencyCode, 'USDT'],
            defaultCurrency: r.currencyCode,
            isActive: r.enabled
        }));

        return NextResponse.json(formattedRegions);
    } catch (error: any) {
        console.error('Countries API Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
