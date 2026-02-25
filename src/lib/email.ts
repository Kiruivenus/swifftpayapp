export async function sendEmail({ to, subject, body }: { to: string, subject: string, body: string }) {
    // In a real production app, you would use nodemailer, sendgrid, or similar.
    // We'll log it for now as requested for the dev flow, 
    // but ensure the interface is clean for future production use.

    console.log('-----------------------------------');
    console.log(`SENDING EMAIL TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: ${body}`);
    console.log('-----------------------------------');

    // Simulate async operation
    return new Promise((resolve) => setTimeout(resolve, 500));
}
