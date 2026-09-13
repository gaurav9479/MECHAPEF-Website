import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '/Users/gauravprajapati/Desktop/MECHAPEF-Website/backend/.env' });

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');


        const PastEvent = mongoose.model('PastEvent', new mongoose.Schema({}, { strict: false }), 'pastevents');
        const events = await PastEvent.find({});
        console.log(`Found ${events.length} past events:`);
        events.forEach(e => {
            console.log(`Event: ${e.title || e.name || 'No title'}, Date: ${e.date}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

test();
