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

        const { default: SectionImage } = await import('file:///Users/gauravprajapati/Desktop/MECHAPEF-Website/backend/src/models/sectionImage.model.js');

        const images = await SectionImage.find({}).sort({ sectionKey: 1 });
        console.log(`Found ${images.length} documents:`);
        images.forEach(img => {
            console.log(`Key: ${img.sectionKey}, Label: ${img.label}, Name: ${img.name || 'N/A'}, RegNo: ${img.regNo || 'N/A'}, URL: ${img.imageURL ? 'Has URL' : 'No URL'}`);
        });
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

test();
