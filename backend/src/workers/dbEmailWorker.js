import PendingEmail from '../models/pendingEmail.model.js';
import sendEmail from '../utils/sendEmail.js';

let isProcessing = false;
let intervalId = null;

export const startDbEmailWorker = () => {
    if (intervalId) {
        console.log('[DB-EmailWorker] DB email worker is already running.');
        return;
    }

    console.log('[DB-EmailWorker] Database-backed email worker started.');

    // Check for pending emails in MongoDB every 15 seconds
    intervalId = setInterval(async () => {
        if (isProcessing) return;
        isProcessing = true;

        try {
            // Find up to 10 pending emails
            const pendingEmails = await PendingEmail.find({ 
                status: { $in: ['pending', 'failed'] }, 
                attempts: { $lt: 3 } 
            })
            .sort({ createdAt: 1 })
            .limit(10);

            if (pendingEmails.length === 0) {
                isProcessing = false;
                return;
            }

            console.log(`[DB-EmailWorker] Found ${pendingEmails.length} pending emails in MongoDB. Processing batch of 10...`);

            // Mark them as processing to avoid double picking
            const emailIds = pendingEmails.map(email => email._id);
            await PendingEmail.updateMany({ _id: { $in: emailIds } }, { status: 'processing' });

            // Send batch concurrently using Promise.allSettled
            const results = await Promise.allSettled(
                pendingEmails.map(async (email) => {
                    try {
                        await sendEmail({
                            to: email.to,
                            subject: email.subject,
                            text: email.text,
                            html: email.html
                        });
                        // Delete successfully sent emails to clean up db storage
                        await PendingEmail.findByIdAndDelete(email._id);
                        return { id: email._id, success: true };
                    } catch (err) {
                        console.error(`[DB-EmailWorker] Failed to send email to ${email.to}:`, err.message);
                        // Increment attempts, set status to failed for retry
                        await PendingEmail.findByIdAndUpdate(email._id, {
                            $inc: { attempts: 1 },
                            status: 'failed',
                            lastError: err.message
                        });
                        return { id: email._id, success: false, error: err.message };
                    }
                })
            );

            const sentCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failedCount = pendingEmails.length - sentCount;
            console.log(`[DB-EmailWorker] Batch processed: ${sentCount} sent, ${failedCount} failed.`);

        } catch (error) {
            console.error('[DB-EmailWorker] Error in database email worker loop:', error.message);
        } finally {
            isProcessing = false;
        }
    }, 15000); // 15 seconds interval
};

export const stopDbEmailWorker = () => {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        console.log('[DB-EmailWorker] Database-backed email worker stopped.');
    }
};
