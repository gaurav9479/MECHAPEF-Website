import PastEvent from '../models/pastEvent.model.js';

export const getPastEvents = async (req, res) => {
    try {
        const events = await PastEvent.find().sort({ order: 1, createdAt: -1 });
        res.status(200).json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createPastEvent = async (req, res) => {
    try {
        const { title, date, description, imageURL, imagekitFileId, mobileImageURL, mobileImagekitFileId } = req.body;
        if (!title || !date || !description || !imageURL) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }


        const lastEvent = await PastEvent.findOne().sort({ order: -1 });
        const newOrder = lastEvent ? lastEvent.order + 1 : 0;

        const newEvent = new PastEvent({
            title,
            date,
            description,
            imageURL,
            imagekitFileId,
            mobileImageURL,
            mobileImagekitFileId,
            order: newOrder,
            updatedBy: req.user._id
        });

        await newEvent.save();
        res.status(201).json({ success: true, data: newEvent });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePastEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body, updatedBy: req.user._id };

        const event = await PastEvent.findByIdAndUpdate(id, updates, { new: true });
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        res.status(200).json({ success: true, data: event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePastEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await PastEvent.findByIdAndDelete(id);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

        res.status(200).json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePastEventsOrder = async (req, res) => {
    try {
        const { orderedIds } = req.body;
        if (!Array.isArray(orderedIds)) {
            return res.status(400).json({ success: false, message: 'orderedIds must be an array' });
        }

        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id },
                update: { order: index, updatedBy: req.user._id }
            }
        }));

        await PastEvent.bulkWrite(bulkOps);
        res.status(200).json({ success: true, message: 'Order updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
