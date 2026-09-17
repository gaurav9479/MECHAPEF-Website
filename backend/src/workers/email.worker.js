import { Worker } from 'bullmq';
import { connection } from '../config/redis.js';
import sendEmail from '../utils/sendEmail.js';

const EMAIL_DELAY_MS = Number(process.env.ANNOUNCEMENT_EMAIL_DELAY_MS || 45000);

export const emailWorker = new Worker('emailQueue', async job => {
    const { to, subject, text, html } = job.data;
    
    console.log(`[EmailWorker] Processing job ${job.id} for ${to}`);
    
    try {
        await sendEmail({ to, subject, text, html });
        console.log(`[EmailWorker] Successfully sent email to ${to}`);
    } catch (error) {
        console.error(`[EmailWorker] Failed to send email to ${to}:`, error.message);
        throw error; 
    }
}, { 
    connection,
    concurrency: 1,
    limiter: {
        max: 1,
        duration: EMAIL_DELAY_MS,
    }
});

emailWorker.on('completed', job => {
    console.log(`[EmailWorker] Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
    console.log(`[EmailWorker] Job ${job.id} has failed with ${err.message}`);
});

let emailWorkerErrorLogged = false;
emailWorker.on('error', async (err) => {
    if (err.message.includes('max requests limit exceeded')) {
        if (!emailWorkerErrorLogged) {
            console.error('\n⚠️ [EmailWorker] Email Worker: Upstash daily limit exceeded. Closing background worker to avoid spam. App will send emails directly via SMTP.');
            emailWorkerErrorLogged = true;
        }
        try {
            await emailWorker.close();
        } catch (e) {}
        return;
    }
    console.error('[EmailWorker] Worker error:', err.message);
});
