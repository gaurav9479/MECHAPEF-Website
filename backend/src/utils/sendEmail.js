import { Resend } from 'resend';

const defaultFrom = process.env.RESEND_FROM_EMAIL || 'MechaPEF <onboarding@resend.dev>';

const sendEmail = async ({ to, subject, html, text, from = defaultFrom }) => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    return resend.emails.send({
        from,
        to,
        subject,
        html,
        text
    });
};

export default sendEmail;
