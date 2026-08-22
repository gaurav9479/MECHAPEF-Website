import { SpecialSponsor } from '../models/specialSponsor.model.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_ieERaSrs_5inv5BYGtNvfW1asWRKSAZjn';
const defaultFrom = process.env.FROM_EMAIL || 'onboarding@resend.dev';

const sendEmail = async ({ to, subject, html, text, from = defaultFrom }) => {
    // If the sender is still using a custom domain but hasn't verified it on Resend,
    // Resend's free tier restricts sending to verified domains only. 
    // If they use onboarding@resend.dev, it must only send to the owner's email address.
    let finalFrom = from;
    if (finalFrom.includes('@mnnit.ac.in') && !process.env.RESEND_DOMAIN_VERIFIED) {
        // Fallback to onboarding domain if domain verification is not complete on Resend dashboard
        finalFrom = 'MechaPEF <onboarding@resend.dev>';
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

    console.log(`[Resend-Email] Dispatching email to ${to} via Resend HTTP API...`);

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
            from: finalFrom,
            to: [to],
            subject: subject,
            html: finalHtml,
            text: text
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Resend API Error: ${data.message || response.statusText} (Code: ${response.status})`);
    }

    console.log(`[Resend-Email] Email successfully sent! Message ID: ${data.id}`);
    return data;
};

export default sendEmail;
