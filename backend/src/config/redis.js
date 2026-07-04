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
    // If a full URL is provided (e.g., from a managed service)
    connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
} else {
    connection = new Redis(redisOptions);
}

export { connection };

connection.on('error', (err) => {
    console.error('[Redis] Connection Error:', err.message);
});

connection.on('connect', () => {
    console.log('[Redis] Connected successfully');
});
