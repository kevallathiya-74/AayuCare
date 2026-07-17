/**
 * Event Controller
 * Hospital events, camps, and health programs management
 */

const eventRepository = require("./event.repository");
const logger = require("../../utils/logger");
const { invalidateByPatterns, EVENT_CACHE_PATTERNS } = require("../../utils/cacheInvalidation");
const { AppError } = require("../../middleware/errorHandler");


/**
 * Get all upcoming events
 * @route   GET /api/events
 * @access  Public
 */
exports.getUpcomingEvents = async (req, res, next) => {
  try {
    const { type, limit = 20, hospitalId: queryHospitalId } = req.query;

    // Whitelist allowed event types from the Event model enum
    const ALLOWED_EVENT_TYPES = [
      "health_camp",
      "awareness",
      "vaccination",
      "screening",
      "seminar",
      "workshop",
      "other",
    ];
    if (type && !ALLOWED_EVENT_TYPES.includes(type)) {
      return next(
        new AppError(
          `Invalid event type. Allowed: ${ALLOWED_EVENT_TYPES.join(", ")}`,
          400,
        ),
      );
    }

    // Use hospitalId from authenticated user (via optionalAuth) if available,
    // falling back to query param for public (unauthenticated) access
    const effectiveHospitalId = req.hospitalId || queryHospitalId;

    const query = {
      isActive: true,
      startDate: new Date(),
      ...(effectiveHospitalId && {
        hospitalId: effectiveHospitalId.toUpperCase(),
      }),
    };

    if (type) {
      query.type = type;
    }

    const events = await eventRepository.findWithFilters(query, {
      limit: parseInt(limit),
      sort: { date: 1 },
    });

    // Calculate spots remaining (0 availableSpots means unlimited)
    const eventsWithSpots = events.map((event) => ({
      ...event,
      spotsRemaining:
        event.availableSpots === 0
          ? null
          : Math.max(0, event.availableSpots - event.registeredCount),
    }));

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Upcoming events retrieved successfully",
      data: { count: eventsWithSpots.length, events: eventsWithSpots }
    });
  } catch (error) {
    logger.error("Error in eventController.getUpcomingEvents", {
      error: error.message,
      stack: error.stack,
    });
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
      return res.status(404).json({ success: false, message: "Event not found", code: "NOT_FOUND" });
    }

    return res.status(200).json({ success: true, message: "Event retrieved successfully", data: event });
  } catch (error) {
    logger.error("Error in eventController.getEventById", {
      error: error.message,
      stack: error.stack,
      eventId: req.params.eventId,
    });
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
      await invalidateByPatterns(EVENT_CACHE_PATTERNS);
      logger.debug("Cache invalidated after event creation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return res.status(201).json({ success: true, message: "Event created successfully", data: event });
  } catch (error) {
    logger.error("Error in eventController.createEvent", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
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
      return res.status(404).json({ success: false, message: "Event not found", code: "NOT_FOUND" });
    }

    // Check if already registered
    const isAlreadyRegistered = await eventRepository.isUserRegistered(
      eventId,
      userId,
    );

    if (isAlreadyRegistered) {
      return res.status(400).json({ success: false, message: "You are already registered for this event", code: "VALIDATION_ERROR" });
    }

    // Check if event is full
    if (
      event.availableSpots > 0 &&
      event.registeredCount >= event.availableSpots
    ) {
      return res.status(409).json({ success: false, message: "Event is full", code: "CONFLICT" });
    }

    // Check if event date has passed
    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ success: false, message: "Cannot register for past events", code: "VALIDATION_ERROR" });
    }

    // Register user for event
    const registrationData = {
      userId: userId,
      status: "registered",
    };

    const updatedEvent = await eventRepository.registerUser(
      eventId,
      registrationData,
    );

    // Invalidate event-related caches after registration
    try {
      await invalidateByPatterns(EVENT_CACHE_PATTERNS);
      logger.debug("Cache invalidated after event registration");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return res.status(200).json({ success: true, message: "Successfully registered for event", data: updatedEvent });
  } catch (error) {
    logger.error("Error in eventController.registerForEvent", {
      error: error.message,
      stack: error.stack,
      eventId: req.params.eventId,
    });
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
      return res.status(404).json({ success: false, message: "Event not found", code: "NOT_FOUND" });
    }

    // Check if user is registered
    const isRegistered = await eventRepository.isUserRegistered(
      eventId,
      userId,
    );

    if (!isRegistered) {
      return res.status(404).json({ success: false, message: "Registration not found", code: "NOT_FOUND" });
    }

    // Unregister user from event
    await eventRepository.unregisterUser(eventId, userId);

    // Invalidate event-related caches after cancellation
    try {
      await invalidateByPatterns(EVENT_CACHE_PATTERNS);
      logger.debug("Cache invalidated after event registration cancellation");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Registration cancelled successfully",
      data: {}
    });
  } catch (error) {
    logger.error("Error in eventController.cancelRegistration", {
      error: error.message,
      stack: error.stack,
      eventId: req.params.eventId,
    });
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
      return res.status(404).json({ success: false, message: "Event not found", code: "NOT_FOUND" });
    }

    // Invalidate event-related caches after update
    try {
      await invalidateByPatterns(EVENT_CACHE_PATTERNS);
      logger.debug("Cache invalidated after event update");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return res.status(200).json({ success: true, message: "Event updated successfully", data: event });
  } catch (error) {
    logger.error("Error in eventController.updateEvent", {
      error: error.message,
      stack: error.stack,
      eventId: req.params.eventId,
    });
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
      return res.status(404).json({ success: false, message: "Event not found", code: "NOT_FOUND" });
    }

    // Invalidate event-related caches after deletion
    try {
      await invalidateByPatterns(EVENT_CACHE_PATTERNS);
      logger.debug("Cache invalidated after event deletion");
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Event deleted successfully",
      data: {}
    });
  } catch (error) {
    logger.error("Error in eventController.deleteEvent", {
      error: error.message,
      stack: error.stack,
      eventId: req.params.eventId,
    });
    next(error);
  }
};
