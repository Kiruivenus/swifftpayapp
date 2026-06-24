import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PlatformSettings from '@/models/PlatformSettings';
import SecurityPolicy from '@/models/SecurityPolicy';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import fs from 'fs';
import path from 'path';

const backupsDir = path.join(process.cwd(), 'backups');

export async function GET(req: NextRequest) {
    const { error } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const files = fs.readdirSync(backupsDir)
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
            .map(f => {
                const filePath = path.join(backupsDir, f);
                const stat = fs.statSync(filePath);
                return {
                    filename: f,
                    size: `${(stat.size / 1024).toFixed(2)} KB`,
                    createdAt: stat.mtime.toISOString(),
                    status: 'COMPLETED'
                };
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ success: true, backups: files });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        await dbConnect();
        const [settings, securityPolicy] = await Promise.all([
            (PlatformSettings as any).getSettings(),
            (SecurityPolicy as any).getSettings()
        ]);

        const backupData = {
            metadata: {
                version: '1.0.0',
                date: new Date().toISOString(),
                generatedBy: admin.email || 'System'
            },
            settings: settings.toObject(),
            securityPolicy: securityPolicy.toObject()
        };

        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        const filename = `backup_${Date.now()}.json`;
        const filePath = path.join(backupsDir, filename);
        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

        return NextResponse.json({ success: true, message: `Backup point ${filename} compiled successfully.` });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.PLATFORM_SETTINGS);
    if (error) return error;

    try {
        const body = await req.json();
        const { filename } = body;

        if (!filename) {
            return NextResponse.json({ success: false, message: 'Backup filename is required.' }, { status: 400 });
        }

        const filePath = path.join(backupsDir, filename);
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ success: false, message: 'Backup file does not exist.' }, { status: 404 });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const backupData = JSON.parse(fileContent);

        await dbConnect();
        
        // Restore settings
        if (backupData.settings) {
            const settings = await (PlatformSettings as any).getSettings();
            Object.keys(backupData.settings).forEach(key => {
                if (key !== '_id' && key !== '__v' && settings[key] !== undefined) {
                    settings[key] = backupData.settings[key];
                }
            });
            settings.updatedBy = admin.id;
            settings.updatedAt = new Date();
            await settings.save();
        }

        // Restore SecurityPolicy
        if (backupData.securityPolicy) {
            const securityPolicy = await (SecurityPolicy as any).getSettings();
            Object.keys(backupData.securityPolicy).forEach(key => {
                if (key !== '_id' && key !== '__v' && securityPolicy[key] !== undefined) {
                    securityPolicy[key] = backupData.securityPolicy[key];
                }
            });
            securityPolicy.updatedBy = admin.id;
            securityPolicy.updatedAt = new Date();
            await securityPolicy.save();
        }

        return NextResponse.json({ success: true, message: 'Settings configuration restored successfully from backup point.' });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
}
