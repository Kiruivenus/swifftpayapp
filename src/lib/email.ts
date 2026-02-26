import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail({ to, subject, body }: { to: string, subject: string, body: string }) {
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

    try {
        const mailOptions = {
            from: EMAIL_FROM,
            to,
            subject,
            html: body,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}
