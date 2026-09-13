import dotenv from 'dotenv';
dotenv.config();

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://eager-adder-145730.upstash.io';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAjlCAAIgcDJlNzJjMGM1OTQ1ZTk0MjQzOTIyMWRkZWI2MjQ3MmRhOA';

class UpstashClient {
    constructor(url = UPSTASH_URL, token = UPSTASH_TOKEN) {
        this.url = url?.replace(/\/$/, '');
        this.token = token;
    }

    async exec(command, ...args) {
        if (!this.url || !this.token) {
            throw new Error('Upstash Redis credentials are not configured.');
        }

        const res = await fetch(`${this.url}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify([command, ...args])
        });

        const data = await res.json();
        if (data.error) {
            throw new Error(`Upstash Error: ${data.error}`);
        }
        return data.result;
    }

    async sadd(key, ...members) {
        return this.exec('SADD', key, ...members);
    }

    async sismember(key, member) {
        return this.exec('SISMEMBER', key, member);
    }

    async smembers(key) {
        return this.exec('SMEMBERS', key);
    }

    async hincrby(key, field, increment = 1) {
        return this.exec('HINCRBY', key, field, increment);
    }

    async hgetall(key) {
        const res = await this.exec('HGETALL', key);
        if (!res) return {};
        if (Array.isArray(res)) {
            const obj = {};
            for (let i = 0; i < res.length; i += 2) {
                obj[res[i]] = res[i + 1];
            }
            return obj;
        }
        return res;
    }

    async hget(key, field) {
        return this.exec('HGET', key, field);
    }

    async del(...keys) {
        return this.exec('DEL', ...keys);
    }

    async keys(pattern = '*') {
        return this.exec('KEYS', pattern);
    }

    async pipeline(commands) {
        if (!this.url || !this.token) {
            throw new Error('Upstash Redis credentials are not configured.');
        }

        const res = await fetch(`${this.url}/pipeline`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(commands)
        });

        const results = await res.json();
        return results.map(r => r.result);
    }
}

export const upstashRedis = new UpstashClient();
export default upstashRedis;
