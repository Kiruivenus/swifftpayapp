import dbConnect from './mongodb';
import PlatformSettings from '@/models/PlatformSettings';
import { NextResponse } from 'next/server';

/**
 * Checks if the platform is in maintenance mode.
 * Should be called in user-facing API routes.
 */
export async function checkMaintenance() {
    try {
        await dbConnect();
        const settings = await (PlatformSettings as any).getSettings();

        if (settings.maintenanceMode) {
            return {
                isMaintenance: true,
                response: NextResponse.json({
                    message: settings.maintenanceMessage || 'System is under maintenance.',
                    maintenance: true
                }, { status: 503 })
            };
        }

        return { isMaintenance: false };
    } catch (error) {
        console.error('Maintenance check failed:', error);
        return { isMaintenance: false };
    }
}
