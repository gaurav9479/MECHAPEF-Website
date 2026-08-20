import nodemailer from 'nodemailer';
import { SpecialSponsor } from '../models/specialSponsor.model.js';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const defaultFrom = process.env.FROM_EMAIL || process.env.SMTP_USER;

const getTransporter = async () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured');
    }

    // Force IPv4 resolution to strictly prevent IPv6 ENETUNREACH
    let ipv4Host = process.env.SMTP_HOST;
    try {
        const addresses = await resolve4(process.env.SMTP_HOST);
        if (addresses && addresses.length > 0) {
            ipv4Host = addresses[0]; // Pick the first IPv4 address
        }
    } catch (err) {
        console.error('IPv4 resolution failed, falling back to hostname', err.message);
    }

    const port = Number(process.env.SMTP_PORT || 465);
    return nodemailer.createTransport({
        host: ipv4Host, // Use the resolved IPv4 address explicitly
        port: port,
        secure: port === 465, // Direct SSL/TLS
        pool: false, // Fresh connection per email
        connectionTimeout: 20000, 
        greetingTimeout: 15000,   
        socketTimeout: 30000,     
        tls: {
            rejectUnauthorized: false,
            servername: process.env.SMTP_HOST // Essential for TLS handshake when connecting via raw IP
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

    const transporter = await getTransporter();

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

    return transporter.sendMail({
        from,
        to,
        subject,
        html: finalHtml,
        text,
        replyTo: process.env.SMTP_USER
    });
};

export default sendEmail;
