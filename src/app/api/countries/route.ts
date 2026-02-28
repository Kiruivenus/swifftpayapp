import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Region from '@/models/Region';

export async function GET() {
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
        return NextResponse.json(regions);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
