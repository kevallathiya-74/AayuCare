/**
 * Event Controller
 * Hospital events, camps, and health programs management
 */

const eventRepository = require('../repositories/eventRepository');
const logger = require('../utils/logger');
const { AppError } = require('../middleware/errorHandler');
const { logError } = logger;
const { invalidateAfterEventMutation } = require('../utils/cacheInvalidation');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Get all upcoming events
 * @route   GET /api/events
 * @access  Public
 */
exports.getUpcomingEvents = async (req, res, next) => {
    try {
        const { type, limit = 20, hospitalId } = req.query;

        // Whitelist allowed event types from the Event model enum
        const ALLOWED_EVENT_TYPES = ['health_camp', 'awareness', 'vaccination', 'screening', 'seminar', 'workshop', 'other'];
        if (type && !ALLOWED_EVENT_TYPES.includes(type)) {
            return next(new AppError(`Invalid event type. Allowed: ${ALLOWED_EVENT_TYPES.join(', ')}`, 400));
        }
        
        const query = {
            isActive: true,
            date: { $gte: new Date() },
            status: { $in: ['upcoming', 'ongoing'] },
            ...(hospitalId && { hospitalId: hospitalId.toUpperCase() }),
        };
        
        if (type) {
            query.type = type;
        }
        
        const events = await eventRepository.findWithFilters(query, {
            limit: parseInt(limit),
            sort: { date: 1 }
        });
        
        // Calculate spots remaining (0 availableSpots means unlimited)
        const eventsWithSpots = events.map(event => ({
            ...event,
            spotsRemaining: event.availableSpots === 0
                ? null
                : Math.max(0, event.availableSpots - event.registeredCount),
        }));
        
        return sendSuccess(
            res,
            req,
            { count: eventsWithSpots.length, events: eventsWithSpots },
            'Upcoming events retrieved successfully'
        );
    } catch (error) {
        logError(error, { context: 'eventController.getUpcomingEvents' });
        next(error);
    }
};

/**
 * Get event by ID
 * @route   GET /api/events/:eventId
 * @access  Public
 */
exports.getEventById = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        
        const event = await eventRepository.findById(eventId);
        
        if (!event) {
            return sendError(res, req, 'Event not found', 404, 'NOT_FOUND');
        }
        
        
        return sendSuccess(res, req, event, 'Event retrieved successfully');
    } catch (error) {
        logError(error, { context: 'eventController.getEventById', eventId: req.params.eventId });
        next(error);
    }
};

/**
 * Create new event (Admin only)
 * @route   POST /api/events
 * @access  Private/Admin
 */
exports.createEvent = async (req, res, next) => {
    try {
        const eventData = {
            ...req.body,
            organizer: req.user.id,
        };
        
        const event = await eventRepository.create(eventData);
        
        // Invalidate event-related caches after creation
        try {
            await invalidateAfterEventMutation();
            logger.debug('Cache invalidated after event creation');
        } catch (cacheError) {
            logger.warn('Failed to invalidate cache:', cacheError.message);
        }
        
        return sendSuccess(res, req, event, 'Event created successfully', 201);
    } catch (error) {
        logError(error, { context: 'eventController.createEvent', userId: req.user.id });
        next(error);
    }
};

/**
 * Register for an event
 * @route   POST /api/events/:eventId/register
 * @access  Private
 */
exports.registerForEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        
        const event = await eventRepository.findById(eventId);
        
        if (!event) {
            return sendError(res, req, 'Event not found', 404, 'NOT_FOUND');
        }
        
        // Check if already registered
        const isAlreadyRegistered = await eventRepository.isUserRegistered(eventId, userId);
        
        if (isAlreadyRegistered) {
            return sendError(res, req, 'You are already registered for this event', 400, 'VALIDATION_ERROR');
        }
        
        // Check if event is full
        if (event.availableSpots > 0 && event.registeredCount >= event.availableSpots) {
            return sendError(res, req, 'Event is full', 400, 'CONFLICT');
        }
        
        // Check if event date has passed
        if (new Date(event.date) < new Date()) {
            return sendError(res, req, 'Cannot register for past events', 400, 'VALIDATION_ERROR');
        }
        
        // Register user for event
        const registrationData = {
            userId: userId,
            status: 'registered',
        };
        
        const updatedEvent = await eventRepository.registerUser(eventId, registrationData);
        
        // Invalidate event-related caches after registration
        try {
            await invalidateAfterEventMutation();
            logger.debug('Cache invalidated after event registration');
        } catch (cacheError) {
            logger.warn('Failed to invalidate cache:', cacheError.message);
        }
        
        return sendSuccess(res, req, updatedEvent, 'Successfully registered for event');
    } catch (error) {
        logError(error, { context: 'eventController.registerForEvent', eventId: req.params.eventId });
        next(error);
    }
};

/**
 * Cancel event registration
 * @route   DELETE /api/events/:eventId/register
 * @access  Private
 */
exports.cancelRegistration = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        
        const event = await eventRepository.findById(eventId);
        
        if (!event) {
            return sendError(res, req, 'Event not found', 404, 'NOT_FOUND');
        }
        
        // Check if user is registered
        const isRegistered = await eventRepository.isUserRegistered(eventId, userId);
        
        if (!isRegistered) {
            return sendError(res, req, 'Registration not found', 404, 'NOT_FOUND');
        }
        
        // Unregister user from event
        await eventRepository.unregisterUser(eventId, userId);
        
        // Invalidate event-related caches after cancellation
        try {
            await invalidateAfterEventMutation();
            logger.debug('Cache invalidated after event registration cancellation');
        } catch (cacheError) {
            logger.warn('Failed to invalidate cache:', cacheError.message);
        }
        
        return sendSuccess(res, req, {}, 'Registration cancelled successfully');
    } catch (error) {
        logError(error, { context: 'eventController.cancelRegistration', eventId: req.params.eventId });
        next(error);
    }
};

/**
 * Update event (Admin only)
 * @route   PUT /api/events/:eventId
 * @access  Private/Admin
 */
exports.updateEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        
        const event = await eventRepository.update(eventId, req.body);
        
        if (!event) {
            return sendError(res, req, 'Event not found', 404, 'NOT_FOUND');
        }
        
        // Invalidate event-related caches after update
        try {
            await invalidateAfterEventMutation();
            logger.debug('Cache invalidated after event update');
        } catch (cacheError) {
            logger.warn('Failed to invalidate cache:', cacheError.message);
        }
        
        return sendSuccess(res, req, event, 'Event updated successfully');
    } catch (error) {
        logError(error, { context: 'eventController.updateEvent', eventId: req.params.eventId });
        next(error);
    }
};

/**
 * Delete event (Admin only)
 * @route   DELETE /api/events/:eventId
 * @access  Private/Admin
 */
exports.deleteEvent = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        
        const event = await eventRepository.delete(eventId);
        
        if (!event) {
            return sendError(res, req, 'Event not found', 404, 'NOT_FOUND');
        }
        
        // Invalidate event-related caches after deletion
        try {
            await invalidateAfterEventMutation();
            logger.debug('Cache invalidated after event deletion');
        } catch (cacheError) {
            logger.warn('Failed to invalidate cache:', cacheError.message);
        }
        
        return sendSuccess(res, req, {}, 'Event deleted successfully');
    } catch (error) {
        logError(error, { context: 'eventController.deleteEvent', eventId: req.params.eventId });
        next(error);
    }
};
