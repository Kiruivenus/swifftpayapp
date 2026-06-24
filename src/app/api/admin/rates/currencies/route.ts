import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Currency from '@/models/Currency';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.AUDIT_LOGS);
    if (error) return error;

    try {
        await dbConnect();
        
        let list = await Currency.find().sort({ code: 1 });
        if (list.length === 0) {
            // Seed defaults
            const defaults = [
                { code: 'USDT', name: 'Tether USD', symbol: '₮', precision: 2, isDefault: true },
                { code: 'KES', name: 'Kenya Shilling', symbol: 'KSh', precision: 2, isDefault: false },
                { code: 'USD', name: 'US Dollar', symbol: '$', precision: 2, isDefault: false },
                { code: 'UGX', name: 'Uganda Shilling', symbol: 'USh', precision: 0, isDefault: false },
                { code: 'TZS', name: 'Tanzania Shilling', symbol: 'TSh', precision: 0, isDefault: false },
                { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', precision: 2, isDefault: false },
                { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', precision: 2, isDefault: false },
                { code: 'EUR', name: 'Euro', symbol: '€', precision: 2, isDefault: false },
                { code: 'GBP', name: 'British Pound', symbol: '£', precision: 2, isDefault: false }
            ];
            await Currency.create(defaults);
            list = await Currency.find().sort({ code: 1 });
        }

        return NextResponse.json({ success: true, currencies: list });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const body = await req.json();
        const { code, name, symbol, precision = 2, enabled = true, conversionRules } = body;

        if (!code || !name || !symbol) {
            return NextResponse.json({ success: false, message: 'Missing required fields: code, name, symbol' }, { status: 400 });
        }

        await dbConnect();

        const existing = await Currency.findOne({ code: code.toUpperCase() });
        if (existing) {
            return NextResponse.json({ success: false, message: 'Currency code already exists.' }, { status: 409 });
        }

        const newCurrency = await Currency.create({
            code: code.toUpperCase(),
            name,
            symbol,
            precision,
            enabled,
            conversionRules: conversionRules || { minLimit: 0, maxLimit: 1000000, autoSync: true }
        });

        // Write rate history & audit log
        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await RateHistory.create({
            type: 'region',
            before: null,
            after: newCurrency,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'ADD_CURRENCY',
            targetType: 'SYSTEM',
            targetId: code.toUpperCase(),
            details: { name, symbol, precision },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, data: newCurrency });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
