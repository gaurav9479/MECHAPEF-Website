import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '/Users/gauravprajapati/Desktop/MECHAPEF-Website/backend/.env' });

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

async function listFiles() {
    try {
        console.log('Fetching files from ImageKit sorted by date...');
        const files = await imagekit.listFiles({
            path: '/mechapef/sections',
            limit: 20,
            sort: 'DESC_CREATED' // Most recent first
        });
        console.log(`Found ${files.length} recent files:`);
        files.forEach(f => {
            console.log(`Name: ${f.name}, CreatedAt: ${f.createdAt}, URL: ${f.url}`);
        });
    } catch (err) {
        console.error('Error fetching ImageKit files:', err);
    }
}

listFiles();
