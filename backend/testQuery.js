import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Need to simulate enough context to load the models
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '/Users/gauravprajapati/Desktop/MECHAPEF-Website/backend/.env' });

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const { default: Registration } = await import('file:///Users/gauravprajapati/Desktop/MECHAPEF-Website/backend/src/models/registration.model.js');
        const { default: User } = await import('file:///Users/gauravprajapati/Desktop/MECHAPEF-Website/backend/src/models/user.model.js');
        const { default: Event } = await import('file:///Users/gauravprajapati/Desktop/MECHAPEF-Website/backend/src/models/event.model.js');

        const eventId = '6a3b774499a72f711659a851'; // From the user's error message
        
        const filter = {
            eventId,
            deletedAt: null
        };

        const registrations = await Registration.find(filter)
            .sort({ registeredAt: -1 })
            .limit(NaN)
            .skip(0)
            .populate('registeredBy', 'name email branch yearOfStudy')
            .populate('eventId', 'title');

        console.log(`Found ${registrations.length} registrations`);
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

test();
