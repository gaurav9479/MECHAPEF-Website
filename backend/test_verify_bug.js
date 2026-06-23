import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import User from './src/models/user.model.js';

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        // Unverify first
        const unverifyDoc = { 
            $set: { 
                isVerified: false, 
                unverifiedRequestExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
            } 
        };
        await User.findByIdAndUpdate(
            "6a395706e028eeec7b957ab1",
            unverifyDoc,
            { new: true }
        );
        console.log("Unverified successfully");

        // Now try to reverify
        const verifyDoc = { $set: { isVerified: true }, $unset: { unverifiedRequestExpiresAt: 1 } };
        const user = await User.findByIdAndUpdate(
            "6a395706e028eeec7b957ab1",
            verifyDoc,
            { new: true, runValidators: true }
        );
        console.log("Re-verified successfully");
    } catch(err) {
        console.error("Error:", err);
    }
    process.exit(0);
});
