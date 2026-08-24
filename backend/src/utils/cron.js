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

export const startCronJobs = () => {
    cron.schedule('0 0 15 5 *', async () => {
        console.log('🔄 Executing Annual Academic Year Promotion Cron Job (May 15)...');
        
        try {

            const fourthYears = await User.find({ yearOfStudy: 4 });
            for (const user of fourthYears) {
                user.role = 'Alumni';

                user.yearOfStudy = 5; 
                await user.save({ validateBeforeSave: false });
            }
            console.log(`✅ Promoted ${fourthYears.length} 4th-year students to Alumni.`);


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

                const registrations = await Registration.find({ eventId: event._id });
                let deletedFilesCount = 0;

                for (const reg of registrations) {
                    let hasChanges = false;
                    const newCustomData = { ...reg.customData };


                    for (const [key, value] of Object.entries(newCustomData)) {
                        if (value && typeof value === 'object' && value.fileId) {
                            try {
                                await imagekit.deleteFile(value.fileId);
                                deletedFilesCount++;
                            } catch (err) {
                                console.error(`Failed to delete file from ImageKit (${value.fileId}):`, err.message);
                            }

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


    cron.schedule('*/10 * * * *', async () => {
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);


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


    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();
            const expiredEvents = await Event.find({
                'deletionState.status': 'APPROVED_RETENTION',
                'deletionState.vanishAt': { $lte: now }
            });

            if (expiredEvents.length > 0) {
                console.log(`🗑️ [7-Day Auto-Purge] Found ${expiredEvents.length} event(s) past 7-day retention deadline. Vanishing data...`);
                for (const ev of expiredEvents) {

                    const regDeleteResult = await Registration.deleteMany({ eventId: ev._id });

                    await Event.findByIdAndDelete(ev._id);
                    console.log(`✅ [7-Day Auto-Purge] Successfully vanished event "${ev.title}" and purged ${regDeleteResult.deletedCount} registration records.`);
                }
            }
        } catch (error) {
            console.error('❌ Error executing 7-Day Event Auto-Purge Cron:', error.message);
        }
    });
};
