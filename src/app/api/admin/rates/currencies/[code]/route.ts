import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Currency from '@/models/Currency';
import ExchangeLimit from '@/models/ExchangeLimit';
import RateHistory from '@/models/RateHistory';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ code: string }> }
) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const { code } = await context.params;
        const body = await req.json();

        await dbConnect();

        const currency = await Currency.findOne({ code: code.toUpperCase() });
        if (!currency) {
            return NextResponse.json({ success: false, message: 'Currency not found.' }, { status: 404 });
        }

        const before = JSON.parse(JSON.stringify(currency));

        // Update settings
        if (body.name !== undefined) currency.name = body.name;
        if (body.symbol !== undefined) currency.symbol = body.symbol;
        if (body.precision !== undefined) currency.precision = body.precision;
        if (body.enabled !== undefined) currency.enabled = body.enabled;
        if (body.iconUrl !== undefined) currency.iconUrl = body.iconUrl;
        if (body.isCrypto !== undefined) currency.isCrypto = body.isCrypto;
        
        if (body.isDefault === true) {
            // Unset other defaults
            await Currency.updateMany({ code: { $ne: code.toUpperCase() } }, { $set: { isDefault: false } });
            currency.isDefault = true;
        } else if (body.isDefault === false) {
            currency.isDefault = false;
        }

        if (body.conversionRules !== undefined) {
            currency.conversionRules = {
                ...currency.conversionRules,
                ...body.conversionRules
            };

            // Sync with ExchangeLimit
            await ExchangeLimit.findOneAndUpdate(
                { currency: code.toUpperCase() },
                {
                    minLimit: body.conversionRules.minLimit !== undefined ? body.conversionRules.minLimit : (currency.conversionRules?.minLimit || 1),
                    maxLimit: body.conversionRules.maxLimit !== undefined ? body.conversionRules.maxLimit : (currency.conversionRules?.maxLimit || 1000000),
                    dailyLimit: body.conversionRules.dailyLimit !== undefined ? body.conversionRules.dailyLimit : 5000000
                },
                { upsert: true }
            );
        }

        await currency.save();

        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await RateHistory.create({
            type: 'region',
            before,
            after: currency,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'UPDATE_CURRENCY',
            targetType: 'SYSTEM',
            targetId: code.toUpperCase(),
            details: { before, after: currency },
            ipAddress: ip,
            userAgent: ua,
            severity: 'INFO'
        });

        return NextResponse.json({ success: true, data: currency });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ code: string }> }
) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.SET_RATES);
    if (error) return error;

    try {
        const { code } = await context.params;

        await dbConnect();

        const deleted = await Currency.findOneAndDelete({ code: code.toUpperCase() });
        if (!deleted) {
            return NextResponse.json({ success: false, message: 'Currency not found.' }, { status: 404 });
        }

        const ip = req.headers.get('x-forwarded-for') || 'Unknown';
        const ua = req.headers.get('user-agent') || 'Unknown';

        await RateHistory.create({
            type: 'region',
            before: deleted,
            after: null,
            changedBy: admin.id,
            ip,
            userAgent: ua
        });

        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'DELETE_CURRENCY',
            targetType: 'SYSTEM',
            targetId: code.toUpperCase(),
            details: { name: deleted.name },
            ipAddress: ip,
            userAgent: ua,
            severity: 'WARNING'
        });

        return NextResponse.json({ success: true, message: 'Currency removed successfully.' });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
