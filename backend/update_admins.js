import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import User from './src/models/user.model.js';

const SEED_USERS = [
    {
        name: 'Gaurav',
        email: 'gaurav.20249013@mnnit.ac.in',
        password: 'gaurav',
        collegeRegNo: '20249013',
        yearOfStudy: 2,
        role: 'SuperAdmin',
        isVerified: true,
        isActive: true,
        branch: 'Mechanical Engineering',
    },
    {
        name: 'Honey',
        email: 'honey.20249013@mnnit.ac.in',
        password: 'honey',
        collegeRegNo: '20240029',
        yearOfStudy: 2,
        role: 'SuperAdmin',
        isVerified: true,
        isActive: true,
        branch: 'Mechanical Engineering',
    }
];

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        for (const userData of SEED_USERS) {
            await User.deleteOne({ email: userData.email });
            const user = new User(userData);
            await user.save({ validateBeforeSave: false });
            console.log(`✅ Created/Updated: ${userData.email} [${userData.role}]`);
        }
    } catch(err) {
        console.error("Error:", err);
    }
    process.exit(0);
});
