import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import APIResponse from '../utils/APIResponse.js';
import User from '../models/user.model.js';
import Team from '../models/team.model.js';
import Announcement from '../models/announcement.model.js';
import Event from '../models/event.model.js';
import PendingEmail from '../models/pendingEmail.model.js';
import sendEmail from '../utils/sendEmail.js';
import logFootprint from '../utils/logFootprint.js';
import { HTTP_STATUS, USER_ROLES } from '../constants/index.js';
import validator from 'validator';
import { getPublicAppUrl, toPublicEmailUrl } from '../utils/publicAppUrl.js';

const EMAIL_DELAY_MS = Number(process.env.ANNOUNCEMENT_EMAIL_DELAY_MS || 1500);

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getDashboardUrl = () => {
    return `${getPublicAppUrl()}/`;
};

const buildEmailContent = (title, description, isEndorsement, endorsementType, customLink = '') => {
    const dashboardUrl = getDashboardUrl();
    const escapedTitle = escapeHtml(title);
    const escapedDescription = escapeHtml(description).replace(/\n/g, '<br>');
    

    let buttonUrl = dashboardUrl;
    let buttonLabel = 'Open Dashboard';

    if (customLink?.trim()) {
        buttonUrl = toPublicEmailUrl(customLink.trim());
        buttonLabel = endorsementType === 'event' ? '🚀 Register Now' : '🔗 Open Link';
    } else if (isEndorsement && endorsementType === 'event') {
        buttonLabel = '🚀 View Event';
    } else if (isEndorsement && endorsementType === 'announcement') {
        buttonLabel = '📢 Read Announcement';
    }
    
    const escapedButtonUrl = escapeHtml(buttonUrl);

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
            `Link: ${buttonUrl}`
        ].join('\n'),
        html: `
            <div style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;color:#111827;">
                <div style="max-width:640px;margin:0 auto;padding:24px;">
                    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;">
                        <p style="margin:0 0 8px;font-size:14px;color:#dc2626;font-weight:bold;">MechaPEF ${typeLabel}</p>
                        <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111827;">${escapedTitle}</h1>
                        <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#374151;">${escapedDescription}</p>
                        <br/>
                        <a href="${escapedButtonUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:700;font-size:16px;">
                            ${buttonLabel}
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
    let { targetRole, endorsementType, endorsementId, customSubject, customBody, customLink, customEmails } = req.body;
    const scheduleType = 'smart_batch';

    if (!targetRole) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'targetRole is required');
    }


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
            if (!customLink) {
                customLink = `${getPublicAppUrl()}/events/${evt._id}`;
            }
        }
    }

    if (!title || !description) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email must have a subject and body, or valid endorsement');
    }

    const uniqueUsersByEmail = new Map();

    if (targetRole === 'custom_csv') {
        if (!customEmails || !Array.isArray(customEmails) || customEmails.length === 0) {
            throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please upload a CSV file with valid emails.');
        }
        for (const email of customEmails) {
            const cleanEmail = email?.trim().toLowerCase();
            if (cleanEmail && validator.isEmail(cleanEmail)) {
                uniqueUsersByEmail.set(cleanEmail, { email: cleanEmail });
            }
        }
    } else {

        let query = { deletedAt: null, isActive: true, email: { $exists: true, $type: 'string', $ne: '' } };
        
        if (targetRole === 'super-admin') query.role = USER_ROLES.SUPER_ADMIN;
        else if (targetRole === 'content-lead') query.role = USER_ROLES.CONTENT_LEAD;
        else if (targetRole === 'media-lead') query.role = USER_ROLES.MEDIA_LEAD;
        else if (targetRole === 'member') query.role = USER_ROLES.MEMBER;


        const users = await User.find(query).select('email name').lean();
        
        for (const user of users || []) {
            const email = user?.email?.trim().toLowerCase();
            if (email && validator.isEmail(email)) {
                uniqueUsersByEmail.set(email, { email, name: user.name || '' });
            }
        }


        let teamQuery = { deletedAt: null, isActive: true, email: { $exists: true, $type: 'string', $ne: '' } };
        if (targetRole === 'media-lead') teamQuery.subTeam = { $in: ['PR', 'Media', 'Graphics'] };

        if (targetRole === 'media-lead' || targetRole === 'all') {
            const teamMembers = await Team.find(teamQuery).select('email name').lean();
            for (const member of teamMembers || []) {
                const email = member?.email?.trim().toLowerCase();
                if (email && validator.isEmail(email) && !uniqueUsersByEmail.has(email)) {
                    uniqueUsersByEmail.set(email, { email, name: member.name || '' });
                }
            }
        }
    }
    
    const validUsers = [...uniqueUsersByEmail.values()];
    
    if (validUsers.length === 0) {
        return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { sent: 0, failed: 0 }, 'No users found for this role'));
    }

    const emailContent = buildEmailContent(title, description, isEndorsement, endorsementType, customLink);
    

    const jobs = validUsers.map((user, index) => {
        let jobDelay = 0;
        if (scheduleType === 'smart_batch') {

            jobDelay = index * 60000;
        }

        return {
            name: 'sendEmail',
            data: {
                to: user.email,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html
            },
            opts: {
                attempts: 3,
                delay: Math.floor(jobDelay),
                backoff: {
                    type: 'exponential',
                    delay: 5000
                }
            }
        };
    });

    try {
        const dbEmails = jobs.map(job => ({
            to: job.data.to,
            subject: job.data.subject,
            text: job.data.text,
            html: job.data.html,
            status: 'pending',
            attempts: 0,
            executeAt: job.opts.delay > 0 ? new Date(Date.now() + job.opts.delay) : new Date()
        }));
        await PendingEmail.insertMany(dbEmails);
        console.log(`[Mail Portal] Successfully saved ${jobs.length} emails to MongoDB pending queue.`);
    } catch (dbErr) {
        console.error('[Mail Portal] Failed to save emails to MongoDB pending queue:', dbErr.message);
    }
    

    logFootprint(req, 'MAIL_SENT', 'Mail Portal', `Queued/sent email "${title}" to ${validUsers.length} users (${targetRole})`);

    return res.status(HTTP_STATUS.OK).json(new APIResponse(HTTP_STATUS.OK, { targeted: validUsers.length }, 'Email dispatch initiated successfully'));
});


export const getMailStats = asyncHandler(async (req, res) => {
    const PendingEmail = (await import('../models/pendingEmail.model.js')).default;
    const Footprint = (await import('../models/footprint.model.js')).default;

    const [pendingCount, processingCount, failedCount, failedEmails, recentLogs] = await Promise.all([
        PendingEmail.countDocuments({ status: 'pending' }),
        PendingEmail.countDocuments({ status: 'processing' }),
        PendingEmail.countDocuments({ status: 'failed' }),
        PendingEmail.find({ status: 'failed' })
            .select('to subject lastError attempts createdAt')
            .sort({ updatedAt: -1 })
            .limit(20)
            .lean(),
        Footprint.find({ action: 'MAIL_SENT' })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean()
    ]);

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, {
            stats: {
                pending: pendingCount,
                processing: processingCount,
                failed: failedCount
            },
            failedEmails: failedEmails.map(f => ({
                id: f._id,
                to: f.to,
                subject: f.subject,
                error: f.lastError || 'Unknown Error',
                attempts: f.attempts,
                createdAt: f.createdAt
            })),
            recentLogs: recentLogs.map(log => ({
                id: log._id,
                userName: log.userName,
                details: log.details,
                createdAt: log.createdAt
            }))
        }, 'Mail statistics fetched successfully')
    );
});


export const retryFailedMails = asyncHandler(async (req, res) => {
    const PendingEmail = (await import('../models/pendingEmail.model.js')).default;
    const { ids } = req.body || {};

    let query = { status: 'failed' };
    if (ids && Array.isArray(ids) && ids.length > 0) {
        query._id = { $in: ids };
    }
    

    const result = await PendingEmail.updateMany(
        query,
        { $set: { status: 'pending', attempts: 0, executeAt: new Date() } }
    );

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { retriedCount: result.modifiedCount }, `${result.modifiedCount} failed email(s) queued for retry!`)
    );
});


export const deleteFailedMails = asyncHandler(async (req, res) => {
    const PendingEmail = (await import('../models/pendingEmail.model.js')).default;
    const { ids, all } = req.body || {};

    let query = { status: 'failed' };
    if (!all && ids && Array.isArray(ids) && ids.length > 0) {
        query._id = { $in: ids };
    } else if (!all && (!ids || ids.length === 0)) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Please select items to delete or specify all: true');
    }

    const result = await PendingEmail.deleteMany(query);

    return res.status(HTTP_STATUS.OK).json(
        new APIResponse(HTTP_STATUS.OK, { deletedCount: result.deletedCount }, `${result.deletedCount} failed email log(s) deleted successfully!`)
    );
});

