import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import User from './src/models/user.model.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const updateDoc = { $set: { isVerified: true }, $unset: { unverifiedRequestExpiresAt: 1 } };
        const user = await User.findByIdAndUpdate(
            "6a395706e028eeec7b957ab1", // a fake id but valid format
            updateDoc,
            { new: true }
        );
        console.log("Success:", user);
    } catch(err) {
        console.error("Error:", err);
    }
    process.exit(0);
});
