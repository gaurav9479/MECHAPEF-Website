import { Worker } from 'bullmq';
import Registration from '../models/registration.model.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';
import { syncWithGoogleSheet } from '../utils/googleSheetsWebhook.js';
import { appendBackupLog } from '../controllers/registration.controller.js';

let worker1 = null;
let worker2 = null;

const createWorker = (queueName, redisConnection) => {
    const worker = new Worker(queueName, async (job) => {
        const {
            eventId,
            registeredBy,
            registrationType,
            teamName,
            teamMembers,
            paymentStatus,
            customData
        } = job.data;

        console.log(`[Worker ${queueName}] Processing registration for user ${registeredBy} -> event ${eventId}`);

        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error(`Event ${eventId} not found`);
        }

        // Check branch eligibility for registerer
        if (event.eligibleBranches && event.eligibleBranches.length > 0) {
            const userObj = await User.findById(registeredBy);
            if (!userObj || !userObj.branch) {
                throw new Error('Please update your branch in your profile before registering');
            }
            const isEligible = event.eligibleBranches.some(b => 
                b.toLowerCase().trim() === userObj.branch.toLowerCase().trim()
            );
            if (!isEligible) {
                throw new Error(`Your branch (${userObj.branch}) is not eligible for this event`);
            }
        }

        if (event.status === 'Ended' || event.status === 'Draft') {
            throw new Error(`Event is not active`);
        }

        if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
            throw new Error(`Registration deadline passed`);
        }

        const existingRegistration = await Registration.findOne({
            eventId,
            registeredBy,
            deletedAt: null
        });
        if (existingRegistration) {
            throw new Error(`User already registered for this event`);
        }

        if (registrationType === 'Team' && teamMembers?.length) {
            const memberIds = teamMembers.map((member) => member.userId);

            // Check branch eligibility for team members
            if (event.eligibleBranches && event.eligibleBranches.length > 0) {
                const membersList = await User.find({ _id: { $in: memberIds } });
                const ineligibleMember = membersList.find(m => {
                    if (!m.branch) return true;
                    return !event.eligibleBranches.some(b => b.toLowerCase().trim() === m.branch.toLowerCase().trim());
                });
                if (ineligibleMember) {
                    throw new Error(`Team member ${ineligibleMember.name} (Branch: ${ineligibleMember.branch || 'Not Set'}) is not eligible for this event.`);
                }
            }

            const alreadyRegisteredMember = await Registration.findOne({
                eventId,
                'teamMembers.userId': { $in: memberIds },
                deletedAt: null
            });

            if (alreadyRegisteredMember) {
                throw new Error('One or more team members are already registered for this event');
            }
        }

        const newRegistration = new Registration({
            eventId,
            registeredBy,
            registrationType,
            teamName,
            teamMembers,
            paymentStatus,
            customData
        });

        try {
            await newRegistration.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new Error('User already registered for this event');
            }
            throw error;
        }

        // Fetch User to send to webhook — use saved registration (not raw job.data)
        // so teamMembers.collegeRegNo is always present for Google Sheets sync
        const registererObj = await User.findById(registeredBy);
        if (registererObj) {
            syncWithGoogleSheet(registererObj, event.title, newRegistration.toObject());
        }

        // Backup Log: Log COMPLETED registration to disk file when saved by worker
        appendBackupLog('COMPLETED_REGISTRATION', newRegistration.toObject());

        // Atomic increment + addToSet in parallel
        await Promise.all([
            Event.findByIdAndUpdate(eventId, { $inc: { totalRegistrations: 1 } }),
            User.findByIdAndUpdate(
                registeredBy,
                { $addToSet: { participatedEventNames: event.title } }
            )
        ]);

        console.log(`[Worker ${queueName}] Registration saved successfully for user ${registeredBy}`);
        return newRegistration._id;
    }, {
        connection: redisConnection,
        concurrency: Number(process.env.REGISTRATION_WORKER_CONCURRENCY || 15),
        limiter: {
            max: Number(process.env.REGISTRATION_WORKER_RATE_LIMIT || 100),
            duration: 1000,
        },
        settings: {
            stalledInterval: 300000,
            drainDelay: 300000,
            lockDuration: 60000,
        }
    });

    worker.on('completed', (job) => console.log(`[Worker ${queueName}] Job ${job.id} completed`));
    worker.on('failed', (job, err) => console.error(`[Worker ${queueName}] Job ${job?.id || 'unknown'} failed:`, err.message));

    let workerErrorLogged = false;
    worker.on('error', async (err) => {
        if (err.message.includes('max requests limit exceeded')) {
            if (!workerErrorLogged) {
                console.error(`\n⚠️ [Worker ${queueName}] Upstash daily limit exceeded. Closing background worker.`);
                workerErrorLogged = true;
            }
            try { await worker.close(); } catch (e) {}
            return;
        }
        console.error(`[Worker ${queueName}] error:`, err.message);
    });

    return worker;
};

export const startRegistrationWorker = (redisConnection1, redisConnection2, queueName1, queueName2) => {
    if (!redisConnection1) {
        console.log('[Worker] Redis not configured. Registration worker will not start.');
        return;
    }

    if (worker1) {
        console.log('[Worker] Registration workers are already running.');
        return;
    }

    worker1 = createWorker(queueName1, redisConnection1);
    console.log(`[Worker] Started listening on ${queueName1}`);

    if (redisConnection2) {
        worker2 = createWorker(queueName2, redisConnection2);
        console.log(`[Worker] Started listening on ${queueName2}`);
    }
};

export const stopRegistrationWorker = async () => {
    if (worker1) {
        try {
            await worker1.close();
            worker1 = null;
            console.log('[Worker] Worker 1 stopped.');
        } catch (e) {
            console.error('[Worker] Error stopping Worker 1:', e);
        }
    }
    if (worker2) {
        try {
            await worker2.close();
            worker2 = null;
            console.log('[Worker] Worker 2 stopped.');
        } catch (e) {
            console.error('[Worker] Error stopping Worker 2:', e);
        }
    }
};