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

        const urls = [
            'https://ik.imagekit.io/o6ogodvtl/mechapef/sections/mechapef_1785513471288_DCofbF47s.jpg',
            'https://ik.imagekit.io/o6ogodvtl/mechapef/sections/mechapef_1785513433686_fudGiG_Zn.jpg',
            'https://ik.imagekit.io/o6ogodvtl/mechapef/sections/mechapef_1785513394836_qFpSCc6z9c.jpg',
            'https://ik.imagekit.io/o6ogodvtl/mechapef/sections/mechapef_1785513350521_aahDLU62A.jpg'
        ];

        for (const url of urls) {
            const img = await SectionImage.findOne({ imageURL: { $regex: new RegExp(url.split('?')[0]) } });
            if (img) {
                console.log(`Matched: URL=${url} is bound to key=${img.sectionKey}, name=${img.name}`);
            } else {
                console.log(`Orphaned: URL=${url} is NOT in the database!`);
            }
        }
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
}

test();
