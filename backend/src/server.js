import 'dotenv/config';

process.on('unhandledRejection', (reason) => {
    const msg = reason?.message || '';
    if (msg.includes('Connection is closed') || msg.includes('limit exceeded') || msg.includes('max requests')) {
        return; // Suppress Upstash/Redis connection closure crashes
    }
    console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    const msg = error?.message || '';
    if (msg.includes('Connection is closed') || msg.includes('limit exceeded') || msg.includes('max requests')) {
        return; // Suppress Upstash/Redis connection closure crashes
    }
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

import app from './app.js';
import connectDB from './config/database.js';
import { startCronJobs } from './utils/cron.js';
import { checkAndToggleRedis } from './queues/registrationQueue.js';
import { startDbEmailWorker } from './workers/dbEmailWorker.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';


const startServer = async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`DB-connected server started`);
            
            // Start background jobs
            startCronJobs();
            checkAndToggleRedis(); // Initial check on boot
            setInterval(checkAndToggleRedis, 5 * 60 * 1000); // Check every 5 mins as fallback
            startDbEmailWorker();
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};
startServer();
