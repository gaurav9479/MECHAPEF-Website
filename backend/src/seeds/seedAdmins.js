/**
 * MECHAPEF Admin Seed Script
 * ─────────────────────────────────────────────────────
 * Seeds privileged users who cannot self-register.
 * Email format enforced: firstname.regno@mnnit.ac.in
 *
 * Usage:
 *   node src/seeds/seedAdmins.js
 * ─────────────────────────────────────────────────────
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/user.model.js';

const SEED_USERS = [
    // ──── SUPER ADMIN ────
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
    },

    // ──── GENERAL USER ────
    {
        name: 'Dhairya',
        email: 'dhairya.20246052@mnnit.ac.in',
        password: 'dhairya',
        collegeRegNo: '20246052',
        role: 'GeneralUser',
        isVerified: true,
        isActive: true,
        branch: 'Mechanical Engineering',
    },
];

// Also clean up the old placeholder accounts if they exist
const OLD_EMAILS = [
    'superadmin@mechapef.in',
    'eventhead@mechapef.in',
    'pr@mechapef.in',
    'alumni@mechapef.in',
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Remove old placeholder accounts
        const deleted = await User.deleteMany({ email: { $in: OLD_EMAILS } });
        if (deleted.deletedCount > 0) {
            console.log(`🗑️  Removed ${deleted.deletedCount} old placeholder account(s)\n`);
        }

        let created = 0;
        let skipped = 0;

        for (const userData of SEED_USERS) {
            const exists = await User.findOne({ email: userData.email });
            if (exists) {
                await User.updateOne({ email: userData.email }, { $set: userData });
                console.log(`✅ Updated: ${userData.email} [${userData.role}]`);
                skipped++;
                continue;
            }

            // Create bypassing the MNNIT email validator since we're seeding directly
            const user = new User(userData);
            await user.save({ validateBeforeSave: false });
            console.log(`✅ Created: ${userData.email} [${userData.role}]`);
            created++;
        }

        console.log('\n─────────────────────────────────────');
        console.log(`✅ Done! Created: ${created} | Skipped: ${skipped}`);
        console.log('─────────────────────────────────────\n');

    } catch (err) {
        console.error('❌ Seed failed:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seed();
