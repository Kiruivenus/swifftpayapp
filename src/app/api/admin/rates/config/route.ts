import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import FxRate from '@/models/FxRate';
import Region from '@/models/Region';
import PlatformFeesLimits from '@/models/PlatformFeesLimits';
import ConversionControl from '@/models/ConversionControl';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS); // Use a broad view permission
    if (error) return error;

    try {
        await dbConnect();

        const [fxRates, regions, feesLimits, conversionControl] = await Promise.all([
            FxRate.find().sort({ baseCurrency: 1, quoteCurrency: 1 }),
            Region.find().sort({ countryName: 1 }),
            (PlatformFeesLimits as any).getSettings(),
            (ConversionControl as any).getSettings()
        ]);

        return NextResponse.json({
            fxRates,
            regions,
            feesLimits,
            conversionControl,
            liveSync: true // UI placeholder, implement real sync status if needed
        });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 500 });
    }
}
