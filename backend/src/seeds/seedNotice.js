import mongoose from 'mongoose';
import Announcement from '../models/announcement.model.js';
import 'dotenv/config';

const seedNotice = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const newNotice = new Announcement({
            title: "Welcome to MechaPEF!",
            description: "Hello everyone, this is the first official notice. Registration is now open! Please verify your accounts to get full access to the platform.",
            priority: "High",
            targetType: "None",
            isActive: true,
            createdBy: "000000000000000000000000" // dummy ID
        });

        await newNotice.save();
        console.log("✅ Seeded dummy notice!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedNotice();
