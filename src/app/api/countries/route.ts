import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Country from '@/models/Country';

export async function GET() {
    try {
        await dbConnect();

        // Seed Kenya if it doesn't exist
        const kenya = await Country.findOne({ countryCode: 'KE' });
        if (!kenya) {
            await Country.create({
                countryName: 'Kenya',
                countryCode: 'KE',
                phoneCode: '+254',
                allowedCurrencies: ['KES', 'USDT'],
                defaultCurrency: 'KES',
                isActive: true,
            });
        }

        const countries = await Country.find({ isActive: true }).sort({ countryName: 1 });
        return NextResponse.json(countries);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
