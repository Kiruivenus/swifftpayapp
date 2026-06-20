import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import PDFDocument from 'pdfkit';
import crypto from 'crypto';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Find the transaction
        const tx = await Transaction.findById(id);
        if (!tx) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Verify that the user is either the sender, recipient or the transaction owner
        const isAuthorized = 
            tx.userId === user.id || 
            tx.senderId === user.id || 
            tx.recipientId === user.id;

        if (!isAuthorized) {
            return NextResponse.json({ message: 'Forbidden. You do not have access to this receipt.' }, { status: 403 });
        }

        // Fetch user profiles to get full names and emails
        const senderProfile = tx.senderId ? await User.findById(tx.senderId).select('fullName username email') : null;
        const recipientProfile = tx.recipientId ? await User.findById(tx.recipientId).select('fullName username email') : null;

        const senderName = senderProfile ? (senderProfile.fullName || senderProfile.username || senderProfile.email) : (tx.senderId || 'SwiftPay User');
        const recipientName = recipientProfile ? (recipientProfile.fullName || recipientProfile.username || recipientProfile.email) : (tx.recipientId || 'SwiftPay User');

        // Cryptographic signature for tamper-proofing
        const signingSecret = process.env.MASTER_ENCRYPTION_KEY || 'fallback_secret';
        const signingData = `${tx._id.toString()}|${tx.amount}|${tx.currency}|${tx.type}|${tx.status}|${tx.createdAt.toISOString()}`;
        const signature = crypto.createHmac('sha256', signingSecret).update(signingData).digest('hex');

        // Generate PDF using pdfkit
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];
        
        doc.on('data', (chunk) => buffers.push(chunk));
        
        const pdfPromise = new Promise<Buffer>((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
        });

        // 1. Header Styles & Accent Banner
        // Draw Navy Header Area
        doc.rect(0, 0, 595, 120).fill('#07090E');
        
        // Draw Orange accent bar
        doc.rect(0, 117, 595, 4).fill('#FF7A00');

        // Brand logo
        doc.fillColor('#FFFFFF')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('SwiftPay', 50, 40);

        doc.fillColor('#FFFFFF')
           .fontSize(10)
           .font('Helvetica')
           .text('OFFICIAL TRANSACTION RECEIPT', 50, 75);

        // Header Metadata
        doc.fillColor('#A0AEC0')
           .fontSize(9)
           .text(`Receipt Date: ${new Date().toLocaleDateString()}`, 380, 45, { align: 'right', width: 165 })
           .text(`Receipt No: REC-${tx._id.toString().substring(0, 8).toUpperCase()}`, 380, 60, { align: 'right', width: 165 });

        // Reset text color to dark
        doc.fillColor('#2D3748');

        // 2. Transaction Summary
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Summary', 50, 150);

        doc.moveTo(50, 170).lineTo(545, 170).stroke('#E2E8F0');

        // Amount Display Big Box
        doc.rect(50, 185, 495, 80).fill('#F7FAFC');
        doc.rect(50, 185, 495, 80).stroke('#E2E8F0');

        doc.fillColor('#718096')
           .fontSize(10)
           .font('Helvetica')
           .text('TRANSACTION AMOUNT', 70, 200);

        const isIncoming = ['RECEIVE', 'TRANSFER_RECEIVE', 'DEPOSIT'].includes(tx.type);
        const amountColor = tx.status === 'FAILED' ? '#D32F2F' : (isIncoming ? '#2E7D32' : '#2D3748');
        const amountPrefix = isIncoming ? '+' : '-';

        doc.fillColor(amountColor)
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(`${amountPrefix}${tx.currency} ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 70, 220);

        // Status Badge inside amount box
        const statusColor = tx.status === 'SUCCESS' ? '#2E7D32' : (tx.status === 'PENDING' ? '#F57C00' : '#D32F2F');
        doc.rect(420, 210, 100, 24).fill(statusColor);
        doc.fillColor('#FFFFFF')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text(tx.status, 420, 217, { align: 'center', width: 100 });

        doc.fillColor('#2D3748'); // Reset to default

        // 3. Detailed Information Section
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Transaction Details', 50, 290);
        doc.moveTo(50, 310).lineTo(545, 310).stroke('#E2E8F0');

        let y = 325;
        const drawDetailRow = (label: string, value: string) => {
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#718096').text(label, 50, y);
            doc.fontSize(10).font('Helvetica').fillColor('#2D3748').text(value, 200, y, { width: 345, align: 'left' });
            y += 22;
        };

        drawDetailRow('Reference ID (TxID)', tx._id.toString());
        drawDetailRow('Transaction Type', tx.type.replace('_', ' '));
        drawDetailRow('Date & Time', tx.createdAt.toLocaleString());
        
        if (tx.fee && tx.fee > 0) {
            drawDetailRow('Network Fee', `${tx.currency} ${tx.fee.toFixed(2)}`);
        }
        if (tx.netAmount) {
            drawDetailRow('Net Amount', `${tx.currency} ${tx.netAmount.toFixed(2)}`);
        }

        if (tx.type.startsWith('TRANSFER')) {
            drawDetailRow('Sender Name', senderName);
            drawDetailRow('Sender Email', senderProfile?.email || 'N/A');
            drawDetailRow('Recipient Name', recipientName);
            drawDetailRow('Recipient Email', recipientProfile?.email || 'N/A');
        } else if (tx.type === 'DEPOSIT') {
            drawDetailRow('Deposit Source', 'M-Pesa STK Push');
            drawDetailRow('M-Pesa Phone', tx.phoneNumber || 'N/A');
            if (tx.mpesaReceiptNumber) {
                drawDetailRow('M-Pesa Receipt No', tx.mpesaReceiptNumber);
            }
        } else if (tx.type === 'WITHDRAW') {
            drawDetailRow('Withdrawal Method', tx.currency === 'USDT' ? 'USDT On-Chain TRC20' : 'M-Pesa Payout');
            drawDetailRow('Destination Account', tx.currency === 'USDT' ? (tx.toAddress || 'N/A') : (tx.phoneNumber || 'N/A'));
        } else if (tx.type === 'CONVERT') {
            drawDetailRow('Converted To', `${tx.secondaryCurrency} ${(tx.secondaryAmount || 0).toFixed(2)}`);
        }

        // 4. Cryptographic Verification & Tamper Protection Box
        y += 15;
        doc.rect(50, y, 495, 110).fill('#F7FAFC');
        doc.rect(50, y, 495, 110).stroke('#E2E8F0');
        
        doc.fillColor('#2D3748')
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('Cryptographic Verification Seal', 70, y + 15);

        doc.fillColor('#718096')
           .fontSize(8)
           .font('Helvetica')
           .text('This receipt contains a secure digital signature generated using SwiftPay\'s master key. Any modifications or alterations to the contents of this document will render the signature invalid and fail verification checks.', 70, y + 32, { width: 450 });

        doc.fillColor('#FF7A00')
           .fontSize(8)
           .font('Courier-Bold')
           .text(`SIGNATURE: ${signature}`, 70, y + 65, { width: 450, lineBreak: true });

        doc.fillColor('#718096')
           .fontSize(8)
           .font('Helvetica-Oblique')
           .text(`Verification URL: https://swiftpay.com/verify-receipt?id=${tx._id.toString()}&sig=${signature.substring(0,16)}`, 70, y + 88, { width: 450 });

        // 5. Footer Footer
        doc.fillColor('#A0AEC0')
           .fontSize(8)
           .font('Helvetica')
           .text('SwiftPay, Inc. • High-Speed Global Cashflows & Payments • https://swiftpay.com', 50, 720, { align: 'center', width: 495 });

        // Finish document
        doc.end();

        const pdfBuffer = await pdfPromise;

        // Set response headers to force download
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `attachment; filename=SwiftPay_Receipt_${tx._id.toString().substring(0,8)}.pdf`);
        headers.set('Content-Length', pdfBuffer.length.toString());

        return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers });

    } catch (error: any) {
        console.error('Receipt Generation Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
