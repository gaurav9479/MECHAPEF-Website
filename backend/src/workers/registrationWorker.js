import { Worker } from 'bullmq';
import Registration from '../models/registration.model.js';
import Event from '../models/event.model.js';
import User from '../models/user.model.js';

let registrationWorker = null;
const QUEUE_NAME = 'RegistrationQueue';

export const startRegistrationWorker = (redisConnection) => {
    if (!redisConnection) {
        console.log('[Worker] Redis not configured. Registration worker will not start.');
        return;
    }

    if (registrationWorker) {
        console.log('[Worker] Registration worker is already running.');
        return;
    }

    registrationWorker = new Worker(QUEUE_NAME, async (job) => {
        const {
            eventId,
            registeredBy,
            registrationType,
            teamName,
            teamMembers,
            paymentStatus,
            customData
        } = job.data;

        console.log(`[Worker] Processing registration for user ${registeredBy} -> event ${eventId}`);

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

        // Atomic increment + addToSet in parallel — no extra countDocuments query
        await Promise.all([
            Event.findByIdAndUpdate(eventId, { $inc: { totalRegistrations: 1 } }),
            User.findByIdAndUpdate(
                registeredBy,
                { $addToSet: { participatedEventNames: event.title } }
            )
        ]);

        console.log(`[Worker] Registration saved successfully for user ${registeredBy}`);
        return newRegistration._id;
    }, {
        connection: redisConnection,
        concurrency: Number(process.env.REGISTRATION_WORKER_CONCURRENCY || 15),
        limiter: {
            max: Number(process.env.REGISTRATION_WORKER_RATE_LIMIT || 100),
            duration: 1000,
        },
        settings: {
            stalledInterval: 300000, // Check for stalled jobs every 5 minutes instead of 30 seconds
            drainDelay: 300000, // If queue is empty, wait 5 minutes before actively polling for delayed jobs
            lockDuration: 60000,
        }
    });

    registrationWorker.on('completed', (job) => {
        console.log(`[Worker] Job ${job.id} completed`);
    });

    registrationWorker.on('failed', (job, err) => {
        console.error(`[Worker] Job ${job?.id || 'unknown'} failed:`, err.message);
    });

    let workerErrorLogged = false;
    registrationWorker.on('error', async (err) => {
        if (err.message.includes('max requests limit exceeded')) {
            if (!workerErrorLogged) {
                console.error('\n⚠️ [Worker] Registration Worker: Upstash daily limit exceeded. Closing background worker to avoid spam. App will process registrations directly.');
                workerErrorLogged = true;
            }
            try {
                await stopRegistrationWorker();
            } catch (e) {}
            return;
        }
        console.error('[Worker] Registration worker error:', err.message);
    });

    console.log('[Worker] Registration worker started and listening for jobs.');
};

export const stopRegistrationWorker = async () => {
    if (registrationWorker) {
        try {
            await registrationWorker.close();
            registrationWorker = null;
            console.log('[Worker] Registration worker stopped.');
        } catch (e) {
            console.error('[Worker] Error stopping worker:', e);
        }
    }
};