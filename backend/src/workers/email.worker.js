import { Worker } from 'bullmq';
import { connection } from '../config/redis.js';
import sendEmail from '../utils/sendEmail.js';

export const emailWorker = new Worker('emailQueue', async job => {
    const { to, subject, text, html } = job.data;
    
    console.log(`[EmailWorker] Processing job ${job.id} for ${to}`);
    
    try {
        await sendEmail({ to, subject, text, html });
        console.log(`[EmailWorker] Successfully sent email to ${to}`);
    } catch (error) {
        console.error(`[EmailWorker] Failed to send email to ${to}:`, error.message);
        throw error; // Let BullMQ handle retries
    }
}, { 
    connection,
    concurrency: 5, // Send up to 5 emails concurrently. Adjust based on email provider rate limits.
    limiter: {
        max: 10, // Max 10 jobs
        duration: 1000, // per 1 second
    }
});

emailWorker.on('completed', job => {
    console.log(`[EmailWorker] Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
    console.log(`[EmailWorker] Job ${job.id} has failed with ${err.message}`);
});
