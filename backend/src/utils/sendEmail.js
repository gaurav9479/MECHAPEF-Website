import nodemailer from 'nodemailer';

const defaultFrom = process.env.FROM_EMAIL || process.env.SMTP_USER;

let transporter;

const getTransporter = () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured');
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    return transporter;
};

const sendEmail = async ({ to, subject, html, text, from = defaultFrom }) => {
    if (!from) {
        throw new Error('FROM_EMAIL or SMTP_USER must be configured');
    }

    return getTransporter().sendMail({
        from,
        to,
        subject,
        html,
        text,
        replyTo: process.env.SMTP_USER
    });
};

export default sendEmail;
