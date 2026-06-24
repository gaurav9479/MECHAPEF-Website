import cron from 'node-cron';
import User from '../models/user.model.js';
import Event from '../models/event.model.js';
import Registration from '../models/registration.model.js';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

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

    // Run every day at 02:00 AM to clean up ended events photos > 4 days old
    cron.schedule('0 2 * * *', async () => {
        console.log('🔄 Executing Event Photo Cleanup Cron Job...');
        try {
            const fourDaysAgo = new Date();
            fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

            const eventsToClean = await Event.find({
                status: 'Ended',
                endedAt: { $lte: fourDaysAgo }
            });

            if (eventsToClean.length === 0) {
                console.log('✅ No events require photo cleanup today.');
                return;
            }

            for (const event of eventsToClean) {
                // Find all registrations for this event
                const registrations = await Registration.find({ eventId: event._id });
                let deletedFilesCount = 0;

                for (const reg of registrations) {
                    let hasChanges = false;
                    const newCustomData = { ...reg.customData };

                    // Find any fileIds in customData
                    for (const [key, value] of Object.entries(newCustomData)) {
                        if (value && typeof value === 'object' && value.fileId) {
                            try {
                                await imagekit.deleteFile(value.fileId);
                                deletedFilesCount++;
                            } catch (err) {
                                console.error(`Failed to delete file from ImageKit (${value.fileId}):`, err.message);
                            }
                            // Replace the object with just a string or null indicating deletion
                            newCustomData[key] = '[File Deleted for Privacy]';
                            hasChanges = true;
                        }
                    }

                    if (hasChanges) {
                        reg.customData = newCustomData;
                        await reg.save();
                    }
                }
                console.log(`✅ Cleaned up ${deletedFilesCount} photos for event: ${event.title}`);
            }

        } catch (error) {
            console.error('❌ Error executing Event Photo Cleanup Cron Job:', error);
        }
    }, {
        timezone: "Asia/Kolkata"
    });

    // Run every 10 minutes to prevent Render cold starts on event days
    cron.schedule('*/10 * * * *', async () => {
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            // Check if there's any active event today
            const eventToday = await Event.findOne({
                startTime: { $lte: todayEnd },
                endTime: { $gte: todayStart }
            });

            if (eventToday) {
                const url = process.env.SERVER_URL || 'http://localhost:5001';
                console.log(`🔄 Event Day active (${eventToday.title})! Pinging server at ${url} to prevent spin-down...`);
                await fetch(url);
            }
        } catch (error) {
            console.error('❌ Error executing Keep-Alive Ping:', error.message);
        }
    });
};
