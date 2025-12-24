/**
 * Event Controller
 * Hospital events, camps, and health programs management
 */

const Event = require('../models/Event');
const { logError } = require('../utils/logger');

/**
 * Get all upcoming events
 * @route   GET /api/events
 * @access  Public
 */
exports.getUpcomingEvents = async (req, res) => {
    try {
        const { type, limit = 20 } = req.query;
        
        const query = {
            isActive: true,
            date: { $gte: new Date() },
            status: { $in: ['upcoming', 'ongoing'] },
        };
        
        if (type) {
            query.type = type;
        }
        
        const events = await Event.find(query)
            .sort({ date: 1 })
            .limit(parseInt(limit))
            .populate('organizer', 'name email')
            .lean();
        
        // Calculate spots remaining
        const eventsWithSpots = events.map(event => ({
            ...event,
            spotsRemaining: event.availableSpots - event.registeredCount,
        }));
        
        res.status(200).json({
            success: true,
            count: eventsWithSpots.length,
            data: eventsWithSpots,
        });
    } catch (error) {
        logError(error, { context: 'eventController.getUpcomingEvents' });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: error.message,
        });
    }
};

/**
 * Get event by ID
 * @route   GET /api/events/:eventId
 * @access  Public
 */
exports.getEventById = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findById(eventId)
            .populate('organizer', 'name email phone')
            .populate('registrations.user', 'name email phone');
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }
        
        // Update status if needed
        event.updateStatus();
        await event.save();
        
        res.status(200).json({
            success: true,
            data: event,
        });
    } catch (error) {
        logError(error, { context: 'eventController.getEventById', eventId: req.params.eventId });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event',
            error: error.message,
        });
    }
};

/**
 * Create new event (Admin only)
 * @route   POST /api/events
 * @access  Private/Admin
 */
exports.createEvent = async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            organizer: req.user._id,
        };
        
        const event = await Event.create(eventData);
        
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event,
        });
    } catch (error) {
        logError(error, { context: 'eventController.createEvent', userId: req.user._id });
        res.status(500).json({
            success: false,
            message: 'Failed to create event',
            error: error.message,
        });
    }
};

/**
 * Register for an event
 * @route   POST /api/events/:eventId/register
 * @access  Private
 */
exports.registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user._id;
        
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }
        
        // Check if already registered
        const alreadyRegistered = event.registrations.some(
            reg => reg.user.toString() === userId.toString()
        );
        
        if (alreadyRegistered) {
            return res.status(400).json({
                success: false,
                message: 'You are already registered for this event',
            });
        }
        
        // Check if event is full
        if (event.availableSpots > 0 && event.registeredCount >= event.availableSpots) {
            return res.status(400).json({
                success: false,
                message: 'Event is full',
            });
        }
        
        // Check if event date has passed
        if (new Date(event.date) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot register for past events',
            });
        }
        
        // Add registration
        event.registrations.push({
            user: userId,
            status: 'registered',
        });
        event.registeredCount += 1;
        
        await event.save();
        
        res.status(200).json({
            success: true,
            message: 'Successfully registered for event',
            data: event,
        });
    } catch (error) {
        logError(error, { context: 'eventController.registerForEvent', eventId: req.params.eventId });
        res.status(500).json({
            success: false,
            message: 'Failed to register for event',
            error: error.message,
        });
    }
};

/**
 * Cancel event registration
 * @route   DELETE /api/events/:eventId/register
 * @access  Private
 */
exports.cancelRegistration = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user._id;
        
        const event = await Event.findById(eventId);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }
        
        // Find and remove registration
        const registrationIndex = event.registrations.findIndex(
            reg => reg.user.toString() === userId.toString()
        );
        
        if (registrationIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found',
            });
        }
        
        event.registrations.splice(registrationIndex, 1);
        event.registeredCount = Math.max(0, event.registeredCount - 1);
        
        await event.save();
        
        res.status(200).json({
            success: true,
            message: 'Registration cancelled successfully',
        });
    } catch (error) {
        logError(error, { context: 'eventController.cancelRegistration', eventId: req.params.eventId });
        res.status(500).json({
            success: false,
            message: 'Failed to cancel registration',
            error: error.message,
        });
    }
};

/**
 * Update event (Admin only)
 * @route   PUT /api/events/:eventId
 * @access  Private/Admin
 */
exports.updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findByIdAndUpdate(
            eventId,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: event,
        });
    } catch (error) {
        logError(error, { context: 'eventController.updateEvent', eventId: req.params.eventId });
        res.status(500).json({
            success: false,
            message: 'Failed to update event',
            error: error.message,
        });
    }
};

/**
 * Delete event (Admin only)
 * @route   DELETE /api/events/:eventId
 * @access  Private/Admin
 */
exports.deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findByIdAndDelete(eventId);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error) {
        logError(error, { context: 'eventController.deleteEvent', eventId: req.params.eventId });
        res.status(500).json({
            success: false,
            message: 'Failed to delete event',
            error: error.message,
        });
    }
};
