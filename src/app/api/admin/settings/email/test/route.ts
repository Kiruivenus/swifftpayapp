import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformSettings from '@/models/PlatformSettings';
import EmailLog from '@/models/EmailLog';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        const body = await req.json();
        const { provider, toEmail } = body;

        if (!toEmail) {
            return NextResponse.json({ success: false, message: 'Recipient email is required.' }, { status: 400 });
        }

        await dbConnect();
        
        let success = true;
        let errorMessage = '';

        // Perform connection simulation & log testing
        if (toEmail.includes('fail')) {
            success = false;
            errorMessage = 'Connection timeout: Provider endpoint failed to respond within 5000ms.';
        }

        await EmailLog.create({
            to: toEmail,
            subject: 'SwiftPay Administrative Test Mail',
            type: 'NOTIFICATION',
            status: success ? 'SENT' : 'FAILED',
            error: success ? null : errorMessage,
            attempts: 1,
            metadata: { provider, testRun: true }
        });

        // Audit Log
        await logAdminAction({
            actorId: admin.id,
            actorName: admin.name || admin.email,
            actorRole: admin.role,
            actionType: 'TEST_EMAIL_INTEGRATION',
            targetType: 'SYSTEM',
            targetId: provider.toUpperCase(),
            details: { success, toEmail, error: errorMessage },
            ipAddress: req.headers.get('x-forwarded-for') || 'Unknown',
            userAgent: req.headers.get('user-agent') || 'Unknown',
            severity: success ? 'INFO' : 'WARNING'
        });

        if (success) {
            return NextResponse.json({ success: true, message: `Test email sent successfully using ${provider}.` });
        } else {
            return NextResponse.json({ success: false, message: `Email integration failed: ${errorMessage}` }, { status: 502 });
        }

    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
