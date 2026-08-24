import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Sponsor from './src/models/sponsor.model.js';
import Announcement from './src/models/announcement.model.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mechapef';

const dummySponsors = [
    {
        companyName: 'TechNova Solutions',
        tier: 'Title',
        logoURL: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=200&fit=crop',
        academicYear: '2026-27',
        isActive: true,
        isPastSponsor: false
    },
    {
        companyName: 'AeroDynamics Pro',
        tier: 'Gold',
        logoURL: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop',
        academicYear: '2026-27',
        isActive: true,
        isPastSponsor: false
    },
    {
        companyName: 'FutureForge',
        tier: 'Silver',
        logoURL: 'https://images.unsplash.com/photo-1516880711640-ef7db81be3e1?w=200&h=200&fit=crop',
        academicYear: '2026-27',
        isActive: true,
        isPastSponsor: false
    },
    {
        companyName: 'MechWorks Inc.',
        tier: 'Bronze',
        logoURL: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=200&h=200&fit=crop',
        academicYear: '2026-27',
        isActive: true,
        isPastSponsor: false
    },
    {
        companyName: 'OldIron Forge',
        tier: 'Bronze',
        logoURL: 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?w=200&h=200&fit=crop',
        academicYear: '2025-26',
        isActive: true,
        isPastSponsor: true
    },
    {
        companyName: 'Vintage Motors',
        tier: 'Silver',
        logoURL: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=200&h=200&fit=crop',
        academicYear: '2025-26',
        isActive: true,
        isPastSponsor: true
    }
];

const seed = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');
        

        await Sponsor.deleteMany({ companyName: { $in: dummySponsors.map(s => s.companyName) } });
        

        const insertedSponsors = await Sponsor.insertMany(dummySponsors);
        console.log(`Dummy sponsors added! Count: ${insertedSponsors.length}`);
        

        const result = await Announcement.updateMany(
            { title: /new website/i },
            { $set: { 
                targetType: 'Event',
                eventSponsors: [
                    { name: insertedSponsors[0].companyName, type: 'Title Sponsor', logoURL: insertedSponsors[0].logoURL },
                    { name: insertedSponsors[1].companyName, type: 'Gold Sponsor', logoURL: insertedSponsors[1].logoURL }
                ]
            }}
        );
        console.log(`Event updated with sponsors! Modified count: ${result.modifiedCount}`);
        
    } catch (err) {
        console.error('Error during seeding:', err);
    } finally {
        mongoose.connection.close();
    }
};

seed();
