import Footprint from '../models/footprint.model.js';
import User from '../models/user.model.js';

/**
 * Utility to asynchronously log an admin action without blocking the main request flow.
 * @param {Object} req - The Express request object (must contain req.user)
 * @param {String} action - 'CREATE' | 'UPDATE' | 'DELETE' | 'MAIL_SENT' | 'SYSTEM_UPDATE'
 * @param {String} resource - The entity affected (e.g., 'Event', 'Announcement', 'Team')
 * @param {String} details - Description of the action (e.g., 'Deleted event XYZ')
 */
const logFootprint = async (req, action, resource, details) => {
    try {
        if (!req.user || !req.user.userId) return;

        // Fetch user name just in case it's not in the JWT
        const user = await User.findById(req.user.userId).select('name');
        const userName = user ? user.name : 'Unknown Admin';

        await Footprint.create({
            user: req.user.userId,
            userName,
            action,
            resource,
            details
        });
    } catch (error) {
        console.error('[Footprint Error] Failed to log action:', error.message);
    }
};

export default logFootprint;
