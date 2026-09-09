import mongoose from 'mongoose';
import User from '../models/user.model.js';

function parseStudentInfoFromRegNo(regNo) {
    if (!regNo || regNo.length < 8) return { branch: undefined, yearOfStudy: undefined };
    const enrollmentYear = parseInt(regNo.substring(0, 4), 10);
    const branchCode = regNo.substring(4, 5);
    if (isNaN(enrollmentYear)) return { branch: undefined, yearOfStudy: undefined };
    let yearOfStudy = 2027 - enrollmentYear;
    if (yearOfStudy < 1) yearOfStudy = 1;
    if (yearOfStudy > 5) yearOfStudy = 5;
    const branchMap = {
        '0': 'Biotechnology',
        '2': 'Chemical Engineering',
        '1': 'Civil Engineering',
        '3': 'Computer Science and Engineering',
        '4': 'Electronics and Communication Engineering',
        '5': 'Electrical Engineering',
        '6': 'Mechanical Engineering',

        '7': 'Production and Industrial Engineering',
        '8': 'Electronics and Computational Mechanics',
        '9': 'Materials Engineering'
    };
    const branch = enrollmentYear === 2026 && branchCode === '9'
        ? 'Mechanical Engineering'
        : branchMap[branchCode];
    return { branch, yearOfStudy };
}

const fixUserBranchesAndYears = async () => {
    try {
        const users = await User.find({
            $or: [
                { branch: { $exists: false } },
                { branch: null },
                { branch: '' },
                { yearOfStudy: { $exists: false } },
                { yearOfStudy: null }
            ]
        });
        if (users.length === 0) return;

        console.log(`[Migration] Found ${users.length} users with missing branch or yearOfStudy.`);
        let fixedCount = 0;
        for (const user of users) {
            if (user.email && user.email.endsWith('@mnnit.ac.in')) {
                const regNoParts = user.email.split('@')[0].split('.');
                const regNoFromEmail = regNoParts[1] || regNoParts[0];
                if (regNoFromEmail) {
                    const { branch: parsedBranch, yearOfStudy: parsedYear } = parseStudentInfoFromRegNo(regNoFromEmail);
                    if (parsedBranch || parsedYear) {
                        user.collegeRegNo = user.collegeRegNo || regNoFromEmail.toUpperCase();
                        user.branch = user.branch || parsedBranch;
                        user.yearOfStudy = user.yearOfStudy || parsedYear;
                        await user.save();
                        fixedCount++;
                    }
                }
            }
        }
        if (fixedCount > 0) {
            console.log(`[Migration] Successfully fixed ${fixedCount} users.`);
        }


        const upgradeResult = await User.updateMany(
            {
                role: 'general-user',
                $or: [
                    { branch: /mechanical/i },
                    { branch: /production/i }
                ]
            },
            { $set: { role: 'member' } }
        );
        if (upgradeResult.modifiedCount > 0) {
            console.log(`[Migration] Upgraded ${upgradeResult.modifiedCount} Mechanical & Production users to member role.`);
        }
    } catch (err) {
        console.error('[Migration] Error updating user branches/roles:', err);
    }
};

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mechapef';

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('MongoDB connected successfully');


        await fixUserBranchesAndYears();

        if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', false);
        }

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('MongoDB error:', error);
});

export default connectDB;
