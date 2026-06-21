import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { validateAdmin } from '@/lib/adminAuth';
import { PERMISSIONS } from '@/lib/rbac';
import PDFDocument from 'pdfkit';

export async function GET(req: NextRequest) {
    const { error, user: admin } = await validateAdmin(req, PERMISSIONS.VIEW_TRANSACTIONS);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('reportType') || 'transaction'; // financial, revenue, transaction, withdrawal
    const format = searchParams.get('format') || 'csv'; // csv, excel, pdf
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    try {
        await dbConnect();

        // 1. Build Query
        const query: any = {};
        const dateFrom = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const dateTo = to ? new Date(to) : new Date();
        
        query.createdAt = { $gte: dateFrom, $lte: dateTo };

        if (reportType === 'withdrawal') {
            query.type = 'WITHDRAW';
        } else if (reportType === 'revenue') {
            query.fee = { $gt: 0 };
        } else if (reportType === 'financial') {
            query.status = 'SUCCESS';
        }

        const transactions = await Transaction.find(query)
            .populate('userId', 'username email fullName')
            .sort({ createdAt: -1 });

        // 2. Generate CSV or Excel (TSV)
        if (format === 'csv' || format === 'excel') {
            let headers: string[] = [];
            let rows: string[][] = [];

            if (reportType === 'revenue') {
                headers = ['Transaction ID', 'User', 'Type', 'Currency', 'Amount', 'Fee (Revenue)', 'Date'];
                rows = transactions.map(t => [
                    t._id.toString(),
                    t.userId?.username || 'System',
                    t.type,
                    t.currency,
                    t.amount.toString(),
                    (t.fee || 0).toString(),
                    new Date(t.createdAt).toISOString()
                ]);
            } else if (reportType === 'withdrawal') {
                headers = ['Payout ID', 'User', 'Email', 'Method', 'Destination', 'Amount', 'Currency', 'Status', 'Date'];
                rows = transactions.map(t => [
                    t._id.toString(),
                    t.userId?.username || 'Unknown',
                    t.userId?.email || 'N/A',
                    t.phoneNumber ? 'MPESA' : 'CRYPTO',
                    t.phoneNumber || t.toAddress || 'N/A',
                    t.amount.toString(),
                    t.currency,
                    t.status,
                    new Date(t.createdAt).toISOString()
                ]);
            } else {
                // Default & Financial
                headers = ['Transaction ID', 'User', 'Type', 'Amount', 'Currency', 'Fee', 'Status', 'M-Pesa Ref', 'Crypto Address', 'Date'];
                rows = transactions.map(t => [
                    t._id.toString(),
                    t.userId?.username || 'System',
                    t.type,
                    t.amount.toString(),
                    t.currency,
                    (t.fee || 0).toString(),
                    t.status,
                    t.mpesaReceiptNumber || 'N/A',
                    t.toAddress || 'N/A',
                    new Date(t.createdAt).toISOString()
                ]);
            }

            const delimiter = format === 'excel' ? '\t' : ',';
            const fileData = [
                headers.join(delimiter),
                ...rows.map(r => r.map(val => `"${val.replace(/"/g, '""')}"`).join(delimiter))
            ].join('\n');

            const contentType = format === 'excel' ? 'application/vnd.ms-excel' : 'text/csv';
            const filename = `swiftpay_${reportType}_report_${Date.now()}.${format === 'excel' ? 'xls' : 'csv'}`;

            return new NextResponse(fileData, {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename=${filename}`,
                }
            });
        }

        // 3. Generate PDF Report using pdfkit
        if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const buffers: Buffer[] = [];
            
            doc.on('data', (chunk) => buffers.push(chunk));
            
            const pdfPromise = new Promise<Buffer>((resolve) => {
                doc.on('end', () => {
                    resolve(Buffer.concat(buffers));
                });
            });

            // Accent Header Banner
            doc.rect(0, 0, 595, 110).fill('#07090E');
            doc.rect(0, 107, 595, 3).fill('#FF7A00');

            doc.fillColor('#FFFFFF')
               .fontSize(22)
               .font('Helvetica-Bold')
               .text('SwiftPay Financial Center', 40, 30);

            doc.fillColor('#A0AEC0')
               .fontSize(9)
               .font('Helvetica')
               .text(`${reportType.toUpperCase()} REPORT`, 40, 58)
               .text(`Generated By: ${admin.name || admin.email}`, 40, 72)
               .text(`Date Range: ${dateFrom.toLocaleDateString()} - ${dateTo.toLocaleDateString()}`, 350, 30, { align: 'right', width: 205 })
               .text(`Total Records: ${transactions.length}`, 350, 45, { align: 'right', width: 205 });

            // Reset text color to default dark
            doc.fillColor('#2D3748');

            // Overview Summary Cards
            let totalVolume = 0;
            let totalFees = 0;
            transactions.forEach(t => {
                const multiplier = t.currency === 'USDT' ? 128.5 : 1;
                totalVolume += t.amount * multiplier;
                totalFees += (t.fee || 0) * multiplier;
            });

            doc.fontSize(11).font('Helvetica-Bold').text('Overview Stats (KES Equivalent)', 40, 130);
            doc.moveTo(40, 145).lineTo(555, 145).stroke('#E2E8F0');

            // Inflow, Outflow, Revenue boxes
            doc.rect(40, 155, 160, 55).fill('#F7FAFC').stroke('#E2E8F0');
            doc.fillColor('#718096').fontSize(8).font('Helvetica').text('VOLUME PROCESSED', 55, 165);
            doc.fillColor('#2D3748').fontSize(12).font('Helvetica-Bold').text(`KES ${Math.round(totalVolume).toLocaleString()}`, 55, 180);

            doc.rect(215, 155, 160, 55).fill('#F7FAFC').stroke('#E2E8F0');
            doc.fillColor('#718096').fontSize(8).font('Helvetica').text('ESTIMATED REVENUE', 230, 165);
            doc.fillColor('#2E7D32').fontSize(12).font('Helvetica-Bold').text(`KES ${Math.round(totalFees).toLocaleString()}`, 230, 180);

            doc.rect(390, 155, 165, 55).fill('#F7FAFC').stroke('#E2E8F0');
            doc.fillColor('#718096').fontSize(8).font('Helvetica').text('NET EARNINGS (85%)', 405, 165);
            doc.fillColor('#FF7A00').fontSize(12).font('Helvetica-Bold').text(`KES ${Math.round(totalFees * 0.85).toLocaleString()}`, 405, 180);

            // Table rendering
            doc.fillColor('#2D3748').fontSize(11).font('Helvetica-Bold').text('Transaction Details', 40, 235);
            doc.moveTo(40, 250).lineTo(555, 250).stroke('#E2E8F0');

            // Draw Table Header
            let y = 260;
            doc.rect(40, y, 515, 20).fill('#07090E');
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
            doc.text('TXID', 45, y + 6);
            doc.text('USER', 150, y + 6);
            doc.text('TYPE', 250, y + 6);
            doc.text('AMOUNT', 330, y + 6);
            doc.text('STATUS', 420, y + 6);
            doc.text('DATE', 485, y + 6);

            y += 20;

            doc.fillColor('#2D3748').font('Helvetica');
            const limitRows = transactions.slice(0, 18); // Limit to 18 rows to fit single page nicely

            limitRows.forEach((t) => {
                doc.fontSize(7);
                doc.text(t._id.toString().slice(-10), 45, y + 6);
                doc.text(t.userId?.username || 'System', 150, y + 6, { width: 95, lineBreak: false });
                doc.text(t.type, 250, y + 6);
                doc.text(`${t.currency} ${t.amount.toLocaleString()}`, 330, y + 6);
                
                const statusColor = t.status === 'SUCCESS' ? '#2E7D32' : (t.status === 'FAILED' ? '#D32F2F' : '#F57C00');
                doc.fillColor(statusColor).text(t.status, 420, y + 6);
                
                doc.fillColor('#2D3748').text(new Date(t.createdAt).toLocaleDateString(), 485, y + 6);
                
                doc.moveTo(40, y + 18).lineTo(555, y + 18).stroke('#EDF2F7');
                y += 18;
            });

            if (transactions.length > 18) {
                doc.fillColor('#718096')
                   .fontSize(8)
                   .font('Helvetica-Oblique')
                   .text(`... and ${transactions.length - 18} more transactions (full ledger exported via CSV/Excel)`, 40, y + 10);
            }

            // Footer
            doc.fillColor('#A0AEC0')
               .fontSize(7)
               .font('Helvetica')
               .text('SwiftPay, Inc. • Internal Compliance & Payout Center • Immutable Administration Audit Log Enabled', 40, 770, { align: 'center', width: 515 });

            doc.end();

            const pdfBuffer = await pdfPromise;

            return new NextResponse(new Uint8Array(pdfBuffer), {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename=swiftpay_${reportType}_report_${Date.now()}.pdf`,
                    'Content-Length': pdfBuffer.length.toString()
                }
            });
        }

    } catch (err: any) {
        console.error('Export generation error:', err);
        return NextResponse.json({ message: err.message || 'Export compilation failed.' }, { status: 500 });
    }
}
