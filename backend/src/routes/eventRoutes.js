/**
 * Event Routes
 * Hospital events, camps, and health programs
 */

const express = require("express");
const router = express.Router();
const eventController = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/auth");
const { validateBody } = require("../middleware/validation");
const { createEventSchema } = require("../validators/schemas");
const { cacheMiddleware, invalidateCache } = require("../middleware/cache");

// Public routes
// @route   GET /api/events
// @desc    Get all upcoming events
// @access  Public
router.get("/", cacheMiddleware(300), eventController.getUpcomingEvents);

// @route   GET /api/events/:eventId
// @desc    Get event by ID
// @access  Public
router.get("/:eventId", cacheMiddleware(300), eventController.getEventById);

// Protected routes (requires authentication)
// @route   POST /api/events/:eventId/register
// @desc    Register for an event
// @access  Private
router.post(
  "/:eventId/register",
  protect,
  eventController.registerForEvent,
  invalidateCache("cache:event:*")
);

// @route   DELETE /api/events/:eventId/register
// @desc    Cancel event registration
// @access  Private
router.delete(
  "/:eventId/register",
  protect,
  eventController.cancelRegistration,
  invalidateCache("cache:event:*")
);

// Admin routes (requires authentication and admin role)
// @route   POST /api/events
// @desc    Create new event
// @access  Private/Admin
router.post(
  "/",
  protect,
  authorize("admin"),
  validateBody(createEventSchema),
  eventController.createEvent,
  invalidateCache("cache:event:*")
);

// @route   PUT /api/events/:eventId
// @desc    Update event
// @access  Private/Admin
router.put(
  "/:eventId",
  protect,
  authorize("admin"),
  validateBody(createEventSchema),
  eventController.updateEvent,
  invalidateCache("cache:event:*")
);

// @route   DELETE /api/events/:eventId
// @desc    Delete event
// @access  Private/Admin
router.delete(
  "/:eventId",
  protect,
  authorize("admin"),
  eventController.deleteEvent,
  invalidateCache("cache:event:*")
);

module.exports = router;
