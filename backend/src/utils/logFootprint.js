import Footprint from '../models/footprint.model.js';
import User from '../models/user.model.js';


const logFootprint = async (req, action, resource, details) => {
    try {
        if (!req.user || !req.user.userId) return;


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
