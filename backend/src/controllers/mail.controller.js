import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';
import User from '../models/user.model.js';
import Announcement from '../models/announcement.model.js';
import Event from '../models/event.model.js';
import sendEmail from '../utils/sendEmail.js';
import logFootprint from '../utils/logFootprint.js';
import { HTTP_STATUS, USER_ROLES } from '../constants/index.js';
import validator from 'validator';

const EMAIL_DELAY_MS = Number(process.env.ANNOUNCEMENT_EMAIL_DELAY_MS || 1500);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getDashboardUrl = () => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${frontendUrl.replace(/\/$/, '')}/`;
};

const buildEmailContent = (title, description, isEndorsement, endorsementType) => {
    const dashboardUrl = getDashboardUrl();
    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(description).replace(/\n/g, '<br>');
    const escapedDashboardUrl = escapeHtml(dashboardUrl);
    
    let typeLabel = "Message";
    if (isEndorsement) {
        typeLabel = endorsementType === 'event' ? 'Event Endorsement' : 'Announcement Endorsement';
    }

    return {
        subject: `MechaPEF: ${title}`,
        text: [
            `MechaPEF ${typeLabel}: ${title}`,
            '',
            description,
            '',
            `Dashboard: ${dashboardUrl}`
        ].join('\n'),
        html: `
            <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#111827;">
                <div style="max-width:640px;margin:0 auto;padding:24px;">
                    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
                        <p style="margin:0 0 8px;font-size:14px;color:#dc2626;font-weight:bold;">MechaPEF ${typeLabel}</p>
                        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111827;">${escapedTitle}</h1>
                        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#374151;">${escapedDescription}</p>
                        <br/>
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

export const sendMail = asyncHandler(async (req, res) => {
    const { targetRole, endorsementType, endorsementId, customSubject, customBody } = req.body;

    if (!targetRole) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'targetRole is required');
    }

    // Determine content
    let title = customSubject || '';
    let description = customBody || '';
    let isEndorsement = false;

    if (endorsementType && endorsementId) {
        isEndorsement = true;
        if (endorsementType === 'announcement') {
            const ann = await Announcement.findById(endorsementId);
            if (!ann) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Announcement not found');
            title = ann.title;
            description = ann.description;
        } else if (endorsementType === 'event') {
            const evt = await Event.findById(endorsementId);
            if (!evt) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Event not found');
            title = evt.title;
            description = evt.description;
        }
    }

    if (!title || !description) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email must have a subject and body, or valid endorsement');
    }

    // Fetch users based on target role
    let query = { deletedAt: null, isActive: true, email: { $exists: true, $type: 'string', $ne: '' } };
    
    if (targetRole === 'super-admin') query.role = USER_ROLES.SUPER_ADMIN;
    else if (targetRole === 'content-lead') query.role = USER_ROLES.CONTENT_LEAD;
    else if (targetRole === 'event-lead') query.role = USER_ROLES.MEDIA_LEAD; // Using media-lead for event-lead currently
    else if (targetRole === 'member') query.role = USER_ROLES.MEMBER;
    // if 'all', don't add role filter

    const users = await User.find(query).select('email').lean();
    
    const uniqueUsersByEmail = new Map();
    for (const user of users || []) {
        const email = user?.email?.trim().toLowerCase();
        if (email && validator.isEmail(email)) {
            uniqueUsersByEmail.set(email, { email });
        }
    }
    
    const validUsers = [...uniqueUsersByEmail.values()];
    
    if (validUsers.length === 0) {
        return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { sent: 0, failed: 0 }, 'No users found for this role'));
    }

    const emailContent = buildEmailContent(title, description, isEndorsement, endorsementType);
    
    // Process sending in background to not block the request
    const sendEmailsInBackground = async () => {
        let sent = 0;
        let failed = 0;
        for (const [index, user] of validUsers.entries()) {
            try {
                await sendEmail({
                    to: user.email,
                    subject: emailContent.subject,
                    text: emailContent.text,
                    html: emailContent.html
                });
                sent++;
            } catch (error) {
                failed++;
                console.error(`[Mail Portal] Failed for ${user.email}:`, error.message);
            }
            if (index < validUsers.length - 1 && EMAIL_DELAY_MS > 0) {
                await sleep(EMAIL_DELAY_MS);
            }
        }
        console.log(`[Mail Portal] Finished sending. Sent: ${sent}, Failed: ${failed}`);
        // Log the footprint asynchronously after sending
        logFootprint(req, 'MAIL_SENT', 'Mail Portal', `Sent email "${title}" to ${validUsers.length} users (${targetRole})`);
    };

    sendEmailsInBackground();

    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { targeted: validUsers.length }, 'Email dispatch started in background'));
});
