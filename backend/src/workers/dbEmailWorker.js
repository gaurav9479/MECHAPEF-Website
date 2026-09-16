import PendingEmail from '../models/pendingEmail.model.js';
import sendEmail from '../utils/sendEmail.js';

const EMAIL_DELAY_MS = Number(process.env.ANNOUNCEMENT_EMAIL_DELAY_MS || 120000);
let isProcessing = false;
let intervalId = null;

export const startDbEmailWorker = () => {
    if (intervalId) {
        console.log('[DB-EmailWorker] DB email worker is already running.');
        return;
    }

    console.log('[DB-EmailWorker] Database-backed email worker started.');


    intervalId = setInterval(async () => {
        if (isProcessing) return;
        isProcessing = true;

        try {
            const now = new Date();
            const TWO_MINS_AGO = new Date(now.getTime() - 2 * 60 * 1000);

            await PendingEmail.updateMany(
                { status: 'processing', updatedAt: { $lt: TWO_MINS_AGO } },
                { $set: { status: 'pending' } }
            );

            const pendingEmails = await PendingEmail.find({ 
                status: { $in: ['pending', 'failed'] }, 
                attempts: { $lt: 3 },
                executeAt: { $lte: now }
            })
            .sort({ executeAt: 1, createdAt: 1 })
            .limit(1);

            if (pendingEmails.length === 0) {
                isProcessing = false;
                return;
            }

            console.log(`[DB-EmailWorker] Found ${pendingEmails.length} pending emails in MongoDB. Processing batch sequentially to avoid SMTP spam filters...`);

            const emailIds = pendingEmails.map(email => email._id);
            await PendingEmail.updateMany({ _id: { $in: emailIds } }, { status: 'processing' });

            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            let sentCount = 0;

            for (const email of pendingEmails) {
                try {
                    const sendPromise = sendEmail({
                        to: email.to,
                        subject: email.subject,
                        text: email.text,
                        html: email.html
                    });

                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Email dispatch timed out after 45s')), 45000)
                    );

                    await Promise.race([sendPromise, timeoutPromise]);

                    await PendingEmail.findByIdAndDelete(email._id);
                    sentCount++;
                } catch (err) {
                    console.error(`[DB-EmailWorker] Failed to send email to ${email.to}:`, err.message);
                    await PendingEmail.findByIdAndUpdate(email._id, {
                        $inc: { attempts: 1 },
                        status: 'failed',
                        executeAt: new Date(Date.now() + EMAIL_DELAY_MS),
                        lastError: err.message
                    });
                }
                
            }

            const failedCount = pendingEmails.length - sentCount;
            console.log(`[DB-EmailWorker] Batch processed sequentially: ${sentCount} sent, ${failedCount} failed.`);

        } catch (error) {
            console.error('[DB-EmailWorker] Error in database email worker loop:', error.message);
        } finally {
            isProcessing = false;
        }
    }, 60000); 
};

export const stopDbEmailWorker = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[DB-EmailWorker] Database-backed email worker stopped.');
    }
};
