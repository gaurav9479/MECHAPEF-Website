import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '/Users/gauravprajapati/Desktop/MECHAPEF-Website/backend/.env' });

async function test() {
    try {
        const localUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/mechapef-test';
        await mongoose.connect(localUri);
        console.log('Connected to Local DB');

        const { default: SectionImage } = await import('file:///Users/gauravprajapati/Desktop/MECHAPEF-Website/backend/src/models/sectionImage.model.js');

        const images = await SectionImage.find({}).sort({ sectionKey: 1 });
        console.log('--- ALL IMAGES IN LOCAL DATABASE ---');
        images.forEach(img => {
            if (img.sectionKey.startsWith('team_')) {
                console.log(`Key: ${img.sectionKey}, Name: ${img.name || 'N/A'}, RegNo: ${img.regNo || 'N/A'}, URL: ${img.imageURL ? 'Has URL' : 'No URL'}, order: ${img.order}`);
            }
        });
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

test();
