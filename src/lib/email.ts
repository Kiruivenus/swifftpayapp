import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailOptions {
    to: string;
    subject: string;
    body?: string; // Standard text body
    code?: string; // For OTP codes
    title?: string; // Main heading in email
    actionText?: string; // Text for a button or emphasized section
    actionUrl?: string; // Link for the button
}

export function renderEmail({ title, body, code, actionText, actionUrl }: Partial<EmailOptions>) {
    const primaryColor = '#FF7A00'; // Glowing Orange
    const darkBg = '#07090E'; // Base background
    const cardBg = '#0D1017'; // Card surface
    const borderCol = '#1E2533'; // Border color

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'SwiftPay Notification'}</title>
    </head>
    <body style="font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #E2E8F0; margin: 0; padding: 0; background-color: ${darkBg};">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${darkBg}; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: ${cardBg}; border: 1px solid ${borderCol}; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                        
                        <!-- Header with Brand Logo -->
                        <tr>
                            <td align="center" style="padding: 30px; border-bottom: 1px solid ${borderCol}; background: rgba(255, 122, 0, 0.02);">
                                <div style="display: inline-flex; align-items: center; gap: 10px; vertical-align: middle;">
                                    <img src="cid:logo" alt="SwiftPay Logo" style="width: 36px; height: 36px; border-radius: 10px; display: inline-block; vertical-align: middle; object-fit: contain;" />
                                    <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; vertical-align: middle; margin-left: 6px;">SwiftPay</span>
                                </div>
                            </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${title || 'Notification'}</h2>
                                <div style="white-space: pre-line; margin-bottom: 24px; font-size: 15px; color: #94A3B8; line-height: 1.7;">${body || 'Hello, you have a new notification from SwiftPay.'}</div>
                                
                                ${code ? `
                                <div style="background: rgba(255, 122, 0, 0.05); border: 1px dashed rgba(255, 122, 0, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin: 30px 0;">
                                    <div style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; font-weight: 700;">Verification Code</div>
                                    <div style="font-size: 38px; font-weight: 800; color: ${primaryColor}; letter-spacing: 6px; font-family: 'JetBrains Mono', monospace;">${code}</div>
                                </div>
                                ` : ''}

                                ${actionText && actionUrl ? `
                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="${actionUrl}" style="display: inline-block; padding: 12px 30px; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 12px rgba(255,122,0,0.25); transition: background 0.3s;">${actionText}</a>
                                </div>
                                ` : ''}

                                <!-- Security Advisory Box -->
                                <div style="border-left: 4px solid ${primaryColor}; background: rgba(255, 122, 0, 0.02); border-top-right-radius: 8px; border-bottom-right-radius: 8px; padding: 16px; margin-top: 35px; font-size: 13px; color: #94A3B8; border-top: 1px solid rgba(255, 122, 0, 0.05); border-right: 1px solid rgba(255, 122, 0, 0.05); border-bottom: 1px solid rgba(255, 122, 0, 0.05);">
                                    <strong style="color: #ffffff;">Security Alert:</strong> Never share verification codes, account PINs, or password details with anyone, including individuals claiming to represent SwiftPay Support. If you did not initiate this request, please change your credentials immediately.
                                </div>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="background: rgba(255, 122, 0, 0.01); padding: 25px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid ${borderCol};">
                                <p style="margin: 5px 0; font-weight: 600; color: #94A3B8;">&copy; ${new Date().getFullYear()} SwiftPay. All rights reserved.</p>
                                <p style="margin: 5px 0;">Nairobi, Kenya</p>
                                <p style="margin: 10px 0 5px 0;">
                                    <a href="#" style="color: ${primaryColor}; text-decoration: none; margin: 0 6px;">Privacy Policy</a> | 
                                    <a href="#" style="color: ${primaryColor}; text-decoration: none; margin: 0 6px;">Terms of Service</a>
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

export async function sendEmail({ to, subject, body, code, title, actionText, actionUrl }: EmailOptions) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();
    const EMAIL_FROM = process.env.EMAIL_FROM?.trim() || 'SwiftPay <no-reply@swiftpay.ke>';

    let emailType = 'NOTIFICATION';
    if (subject.toLowerCase().includes('verify') || subject.toLowerCase().includes('welcome')) emailType = 'EMAIL_VERIFICATION';
    else if (subject.toLowerCase().includes('reset')) emailType = 'PASSWORD_RESET';
    else if (subject.toLowerCase().includes('verification code') || subject.toLowerCase().includes('2fa')) emailType = '2FA_CODE';
    else if (subject.toLowerCase().includes('security') || subject.toLowerCase().includes('alert')) emailType = 'SECURITY_ALERT';

    const maxRetries = 2;
    let attempts = 0;
    let lastError = null;

    // Load logo image buffer for attachments
    let logoBase64 = '';
    try {
        const logoPath = path.join(process.cwd(), 'public', 'logo.png');
        if (fs.existsSync(logoPath)) {
            logoBase64 = fs.readFileSync(logoPath).toString('base64');
        }
    } catch (err) {
        console.error('Failed to read logo.png for email attachments:', err);
    }

    while (attempts < maxRetries) {
        attempts++;
        try {
            const htmlContent = renderEmail({ title: title || subject, body, code, actionText, actionUrl });

            // Method A: Check for Resend API Key and use it
            if (RESEND_API_KEY && RESEND_API_KEY !== 'placeholder_key') {
                const resendAttachments = [];
                if (logoBase64) {
                    resendAttachments.push({
                        filename: 'logo.png',
                        content: logoBase64,
                        content_id: 'logo',
                        contentId: 'logo',
                        id: 'logo'
                    });
                }

                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${RESEND_API_KEY}`
                    },
                    body: JSON.stringify({
                        from: EMAIL_FROM,
                        to: [to],
                        subject,
                        html: htmlContent,
                        text: body + (code ? ` Code: ${code}` : ''),
                        attachments: resendAttachments
                    })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || `Resend API failed with status ${res.status}`);
                }

                // Log Success to DB
                await logEmailEvent(to, subject, emailType, 'SENT', attempts);
                return data;
            } else {
                // Method B: Fallback to SMTP
                const SMTP_HOST = process.env.SMTP_HOST?.trim();
                const SMTP_PORT = process.env.SMTP_PORT?.trim();
                const SMTP_USER = process.env.SMTP_USER?.trim();
                const SMTP_PASS = process.env.SMTP_PASS?.trim();

                if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || SMTP_USER === 'your-email@gmail.com') {
                    throw new Error('Email delivery skipped: No Resend API Key or SMTP credentials defined in .env');
                }

                const transporter = nodemailer.createTransport({
                    host: SMTP_HOST,
                    port: parseInt(SMTP_PORT || '587'),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: SMTP_USER,
                        pass: SMTP_PASS,
                    },
                });

                const smtpAttachments = [];
                if (logoBase64) {
                    smtpAttachments.push({
                        filename: 'logo.png',
                        path: path.join(process.cwd(), 'public', 'logo.png'),
                        cid: 'logo'
                    });
                }

                const info = await transporter.sendMail({
                    from: EMAIL_FROM,
                    to,
                    subject,
                    html: htmlContent,
                    text: body + (code ? ` Code: ${code}` : ''),
                    attachments: smtpAttachments,
                });

                // Log Success to DB
                await logEmailEvent(to, subject, emailType, 'SENT', attempts);
                return info;
            }
        } catch (error: any) {
            lastError = error;
            console.error(`Email delivery attempt ${attempts} failed:`, error.message);
            if (attempts < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    // Log Final Failure to DB
    await logEmailEvent(to, subject, emailType, 'FAILED', attempts, lastError?.message || 'Failed after all retries');
    throw lastError;
}

async function logEmailEvent(to: string, subject: string, type: string, status: 'SENT' | 'FAILED', attempts: number, error?: string) {
    try {
        const EmailLog = (await import('@/models/EmailLog')).default;
        await EmailLog.create({
            to,
            subject,
            type,
            status,
            attempts,
            error,
            sentAt: new Date()
        });
    } catch (logErr) {
        console.error('Failed to log email event:', logErr);
    }
}
