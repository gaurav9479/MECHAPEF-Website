import nodemailer from 'nodemailer';
import { SpecialSponsor } from '../models/specialSponsor.model.js';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const defaultFrom = process.env.SMTP_USER || process.env.FROM_EMAIL;

let cachedTransporter = null;
let cachedHost = null;

const getTransporter = async () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS) must be configured');
    }

    if (!cachedTransporter) {
        let ipv4Host = process.env.SMTP_HOST;
        try {
            const addresses = await resolve4(process.env.SMTP_HOST);
            if (addresses && addresses.length > 0) {
                ipv4Host = addresses[0];
            }
        } catch (err) {
            console.error('[Email] IPv4 resolution failed, using hostname:', err.message);
        }

        const port = Number(process.env.SMTP_PORT || 465);
        cachedHost = ipv4Host;
        cachedTransporter = nodemailer.createTransport({
            host: ipv4Host,
            port: port,
            secure: port === 465,
            family: 4,
            pool: true,
            maxConnections: 1, 
            maxMessages: 100,
            idleTimeout: 300000, 
            connectionTimeout: 30000,
            greetingTimeout: 20000,
            socketTimeout: 45000,
            tls: {
                rejectUnauthorized: false,
                servername: process.env.SMTP_HOST
            },
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    return cachedTransporter;
};

const sendEmail = async ({ to, subject, html, text, from = defaultFrom }) => {
    let transporter;
    try {
        transporter = await getTransporter();
    } catch (err) {
        cachedTransporter = null; 
        throw err;
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
            if (finalHtml.includes('</body>')) {
                finalHtml = finalHtml.replace('</body>', `${sponsorHtml}</body>`);
            } else {
                finalHtml += sponsorHtml;
            }
        }
    } catch (err) {
        console.error('[Email] Error injecting sponsor banner:', err.message);
    }

    const finalFrom = from || process.env.SMTP_USER;
    const port = Number(process.env.SMTP_PORT || 465);
    console.log(`[Email] Sending to: ${to} via SMTP (${process.env.SMTP_HOST}:${port})`);

    try {
        const info = await transporter.sendMail({
            from: `MechaPEF <${finalFrom}>`,
            to,
            subject,
            html: finalHtml,
            text,
            replyTo: process.env.SMTP_USER
        });

        console.log(`[Email] Successfully sent to ${to}! MessageId: ${info.messageId}`);
        return info;
    } catch (err) {
        // If pool connection died, clear cache so next attempt creates a fresh connection
        cachedTransporter = null;
        throw err;
    }
};

export default sendEmail;
