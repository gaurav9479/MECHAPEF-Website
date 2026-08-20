import nodemailer from 'nodemailer';
import { SpecialSponsor } from '../models/specialSponsor.model.js';
import dns from 'dns';

// Force Node.js (v17+) to resolve IPv4 addresses first.
// This completely stops Node from trying to connect to Gmail's IPv6 (2404:6800...)
// which causes ENETUNREACH on networks without active IPv6 routing.
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

const defaultFrom = process.env.FROM_EMAIL || process.env.SMTP_USER;

const getTransporter = () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured');
    }

    const port = Number(process.env.SMTP_PORT || 465);
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465, // Direct SSL/TLS for 465 (bypasses STARTTLS timeouts)
        family: 4, // Force IPv4 to avoid IPv6 (ENETUNREACH) network routing issues
        pool: false, // Disabled pooling: fresh connection per email avoids stale socket timeouts
        connectionTimeout: 20000, // 20s connection timeout
        greetingTimeout: 15000,   // 15s greeting timeout
        socketTimeout: 30000,     // 30s socket timeout
        tls: {
            rejectUnauthorized: false
        },
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

const sendEmail = async ({ to, subject, html, text, from = defaultFrom }) => {
    if (!from) {
        throw new Error('FROM_EMAIL or SMTP_USER must be configured');
    }

    let finalHtml = html;
    try {
        const sponsor = await SpecialSponsor.findOne({ isActive: true });
        if (sponsor && sponsor.includeInEmails && sponsor.logoURL) {
            const sponsorHtml = `
            <div style="position: relative; margin-top: 30px; text-align: center; font-family: sans-serif;">
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin-bottom: 20px;" />
                <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Special Feature</p>
                <div style="display: inline-block; padding: 15px; border-radius: 50%; background: #ffffff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #f0f0f0;">
                    <img src="${sponsor.logoURL}" alt="${sponsor.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 50%;" />
                </div>
                ${sponsor.tagline ? `<p style="margin-top: 15px; font-size: 14px; color: #555; font-weight: 500;">${sponsor.tagline}</p>` : ''}
            </div>`;
            
            // Inject before closing body tag if it exists, else append
            if (finalHtml.includes('</body>')) {
                finalHtml = finalHtml.replace('</body>', `${sponsorHtml}</body>`);
            } else {
                finalHtml += sponsorHtml;
            }
        }
    } catch (err) {
        console.error('Error injecting special sponsor into email:', err);
    }

    return getTransporter().sendMail({
        from,
        to,
        subject,
        html: finalHtml,
        text,
        replyTo: process.env.SMTP_USER
    });
};

export default sendEmail;
