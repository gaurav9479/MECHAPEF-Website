import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const redisOptions = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
};

let connection;

if (process.env.REDIS_URL) {

    connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
} else {
    connection = new Redis(redisOptions);
}

export { connection };

let redisErrorLogged = false;
connection.on('error', (err) => {
    if (err.message.includes('max requests limit exceeded')) {
        if (!redisErrorLogged) {
            console.error('\n⚠️ [Redis] Upstash Redis Daily Request Limit Exceeded (500k limit reached). All background queues will fall back to local/direct execution.');
            redisErrorLogged = true;
        }
        return;
    }
    console.error('[Redis] Connection Error:', err.message);
});

connection.on('connect', () => {
    console.log('[Redis] Connected successfully');
    redisErrorLogged = false; 
});
