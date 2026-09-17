import validator from 'validator';
import Announcement from '../models/announcement.model.js';
import sendEmail from './sendEmail.js';
import { getPublicAppUrl } from './publicAppUrl.js';

const EMAIL_DELAY_MS = Number(process.env.ANNOUNCEMENT_EMAIL_DELAY_MS || 45000);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getDashboardUrl = () => {
    return `${getPublicAppUrl()}/`;
};

const getAnnouncementDate = (announcement) => {
    const date = announcement?.createdAt || new Date();
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
    }).format(new Date(date));
};

const buildAnnouncementEmail = (announcement) => {
    const title = announcement?.title || 'New Announcement';
    const description = announcement?.description || '';
    const dashboardUrl = getDashboardUrl();
    const announcementDate = getAnnouncementDate(announcement);

    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(description).replace(/\n/g, '<br>');
    const escapedDate = escapeHtml(announcementDate);
    const escapedDashboardUrl = escapeHtml(dashboardUrl);

    return {
        subject: `MechaPEF announcement: ${title}`,
        text: [
            `MechaPEF Announcement: ${title}`,
            '',
            description,
            '',
            `Date and time: ${announcementDate}`,
            `Dashboard: ${dashboardUrl}`
        ].join('\n'),
        html: `
            <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#111827;">
                <div style="max-width:640px;margin:0 auto;padding:24px;">
                    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
                        <p style="margin:0 0 8px;font-size:14px;color:#6b7280;">MechaPEF Announcement</p>
                        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111827;">${escapedTitle}</h1>
                        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#374151;">${escapedDescription}</p>
                        <p style="margin:0 0 22px;font-size:14px;color:#6b7280;">
                            Date and time: ${escapedDate}
                        </p>
                        <a href="${escapedDashboardUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700;">
                            Open Dashboard
                        </a>
                        <p style="margin:22px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">
                            You are receiving this email because you are registered with MechaPEF.
                        </p>
                    </div>
                </div>
            </div>
        `
    };
};

export const sendAnnouncementEmail = async (users, announcement) => {
    if (!announcement?._id) {
        throw new Error('Announcement with _id is required for email notifications');
    }

    const lockedAnnouncement = await Announcement.findOneAndUpdate(
        {
            _id: announcement._id,
            emailNotificationStartedAt: null,
            emailNotificationSentAt: null
        },
        {
            emailNotificationStartedAt: new Date(),
            emailNotificationFailedEmails: []
        },
        { new: true }
    );

    if (!lockedAnnouncement) {
        console.log(`[Announcement Email] Skipped duplicate send for announcement ${announcement._id}`);
        return { sent: 0, failed: 0, skipped: true, failedEmails: [] };
    }

    const uniqueUsersByEmail = new Map();
    for (const user of users || []) {
        const email = user?.email?.trim().toLowerCase();
        if (email && validator.isEmail(email)) {
            uniqueUsersByEmail.set(email, { ...user, email });
        }
    }

    const validUsers = [...uniqueUsersByEmail.values()];
    const failedEmails = [];
    let sent = 0;
    const emailContent = buildAnnouncementEmail(lockedAnnouncement);

    for (const [index, user] of validUsers.entries()) {
        try {
            await sendEmail({
                to: user.email,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html
            });
            sent += 1;
        } catch (error) {
            failedEmails.push({
                email: user.email,
                reason: error.message,
                failedAt: new Date()
            });
            console.error(`[Announcement Email] Failed for ${user.email}:`, error.message);
        }

        if (index < validUsers.length - 1 && EMAIL_DELAY_MS > 0) {
            await sleep(EMAIL_DELAY_MS);
        }
    }

    await Announcement.findByIdAndUpdate(announcement._id, {
        emailNotificationSentAt: new Date(),
        emailNotificationFailedEmails: failedEmails
    });

    console.log(`[Announcement Email] Announcement ${announcement._id}: sent ${sent}, failed ${failedEmails.length}`);

    return { sent, failed: failedEmails.length, skipped: false, failedEmails };
};

export default sendAnnouncementEmail;
