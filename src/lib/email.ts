import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    body?: string; // Standard text body
    code?: string; // For OTP codes
    title?: string; // Main heading in email
    actionText?: string; // Text for a button or emphasized section
}

export function renderEmail({ title, body, code, actionText }: Partial<EmailOptions>) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title || 'SwiftPay Notification'}</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f9; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); padding: 30px; text-align: center; color: white; }
            .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
            .content { padding: 40px; }
            .content h2 { color: #1e293b; margin-top: 0; font-size: 22px; }
            .content p { font-size: 16px; color: #475569; margin-bottom: 24px; }
            .code-box { background: #fff1f2; border: 2px dashed #fecdd3; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .code { font-size: 36px; font-weight: bold; color: #e11d48; letter-spacing: 4px; font-family: monospace; }
            .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
            .footer p { margin: 5px 0; }
            .button { display: inline-block; padding: 12px 24px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px; }
            .security-note { border-left: 4px solid #e11d48; background: #fff1f2; padding: 15px; margin-top: 25px; font-size: 14px; color: #9f1239; border-radius: 0 4px 4px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>SwiftPay</h1>
            </div>
            <div class="content">
                <h2>${title || 'Notification'}</h2>
                <div style="white-space: pre-line; margin-bottom: 20px;">${body || 'Hello, you have a new notification from SwiftPay.'}</div>
                
                ${code ? `
                <div class="code-box">
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 10px;">Your security code is</div>
                    <div class="code" id="verification-code">${code}</div>
                </div>
                ` : ''}

                ${actionText ? `<div style="text-align:center;"><div class="button">${actionText}</div></div>` : ''}

                <div class="security-note">
                    <strong>Security Tip:</strong> If you did not request this email, please ignore it or contact our support team immediately. Never share your security codes with anyone. 
                </div>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} SwiftPay. All rights reserved.</p>
                <p>Nairobi, Kenya</p>
                <p><a href="#" style="color: #6366f1; text-decoration: none;">Privacy Policy</a> | <a href="#" style="color: #6366f1; text-decoration: none;">Terms of Service</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
}

export async function sendEmail({ to, subject, body, code, title, actionText }: EmailOptions) {
    const SMTP_HOST = process.env.SMTP_HOST?.trim();
    const SMTP_PORT = process.env.SMTP_PORT?.trim();
    const SMTP_USER = process.env.SMTP_USER?.trim();
    const SMTP_PASS = process.env.SMTP_PASS?.trim();
    const EMAIL_FROM = process.env.EMAIL_FROM?.trim();

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || SMTP_USER === 'your-email@gmail.com') {
        console.error('SMTP Check:', { SMTP_HOST, SMTP_USER, hasPass: !!SMTP_PASS });
        throw new Error(`Email configuration is missing or using default placeholders in .env (User: ${SMTP_USER})`);
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

    // Identify email type for logging
    let emailType = 'NOTIFICATION';
    if (subject.toLowerCase().includes('verify') || subject.toLowerCase().includes('welcome')) emailType = 'EMAIL_VERIFICATION';
    else if (subject.toLowerCase().includes('reset')) emailType = 'PASSWORD_RESET';
    else if (subject.toLowerCase().includes('verification code') || subject.toLowerCase().includes('2fa')) emailType = '2FA_CODE';
    else if (subject.toLowerCase().includes('security') || subject.toLowerCase().includes('alert')) emailType = 'SECURITY_ALERT';

    const maxRetries = 2;
    let attempts = 0;
    let lastError = null;

    while (attempts < maxRetries) {
        attempts++;
        try {
            const htmlContent = renderEmail({ title: title || subject, body, code, actionText });

            const mailOptions = {
                from: EMAIL_FROM,
                to,
                subject,
                html: htmlContent,
                text: body + (code ? ` Code: ${code}` : ''), // Fallback text version
            };

            const info = await transporter.sendMail(mailOptions);

            // Log Success
            try {
                const EmailLog = (await import('@/models/EmailLog')).default;
                await EmailLog.create({
                    to,
                    subject,
                    type: emailType,
                    status: 'SENT',
                    attempts,
                    sentAt: new Date()
                });
            } catch (logErr) {
                console.error('Failed to log email success:', logErr);
            }

            return info;
        } catch (error: any) {
            lastError = error;
            console.error(`Email attempt ${attempts} failed:`, error.message);
            if (attempts < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before retry
            }
        }
    }

    // Log Failure after all retries
    try {
        const EmailLog = (await import('@/models/EmailLog')).default;
        await EmailLog.create({
            to,
            subject,
            type: emailType,
            status: 'FAILED',
            error: lastError?.message || 'Unknown error',
            attempts,
            sentAt: new Date()
        });
    } catch (logErr) {
        console.error('Failed to log email failure:', logErr);
    }

    throw lastError;
}
