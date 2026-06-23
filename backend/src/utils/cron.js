import cron from 'node-cron';
import User from '../models/user.model.js';

// Run every year on May 15 at 00:00 (Midnight)
// cron expression format: minute hour dayOfMonth month dayOfWeek
export const startCronJobs = () => {
    cron.schedule('0 0 15 5 *', async () => {
        console.log('🔄 Executing Annual Academic Year Promotion Cron Job (May 15)...');
        
        try {
            // Find all users who are currently 4th year and promote them to Alumni
            const fourthYears = await User.find({ yearOfStudy: 4 });
            for (const user of fourthYears) {
                user.role = 'Alumni';
                // Set to 5 to indicate passed out.
                user.yearOfStudy = 5; 
                await user.save({ validateBeforeSave: false });
            }
            console.log(`✅ Promoted ${fourthYears.length} 4th-year students to Alumni.`);

            // Now increment yearOfStudy for 1st, 2nd, and 3rd years
            const lowerYears = await User.find({ yearOfStudy: { $in: [1, 2, 3] } });
            for (const user of lowerYears) {
                user.yearOfStudy += 1;
                await user.save({ validateBeforeSave: false });
            }
            console.log(`✅ Advanced academic year for ${lowerYears.length} students.`);

        } catch (error) {
            console.error('❌ Error executing Annual Promotion Cron Job:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });
};
