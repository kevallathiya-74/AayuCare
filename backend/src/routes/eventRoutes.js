/**
 * Event Routes
 * Hospital events, camps, and health programs
 */

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
// @route   GET /api/events
// @desc    Get all upcoming events
// @access  Public
router.get('/', eventController.getUpcomingEvents);

// @route   GET /api/events/:eventId
// @desc    Get event by ID
// @access  Public
router.get('/:eventId', eventController.getEventById);

// Protected routes (requires authentication)
// @route   POST /api/events/:eventId/register
// @desc    Register for an event
// @access  Private
router.post('/:eventId/register', protect, eventController.registerForEvent);

// @route   DELETE /api/events/:eventId/register
// @desc    Cancel event registration
// @access  Private
router.delete('/:eventId/register', protect, eventController.cancelRegistration);

// Admin routes (requires authentication and admin role)
// @route   POST /api/events
// @desc    Create new event
// @access  Private/Admin
router.post('/', protect, authorize('admin'), eventController.createEvent);

// @route   PUT /api/events/:eventId
// @desc    Update event
// @access  Private/Admin
router.put('/:eventId', protect, authorize('admin'), eventController.updateEvent);

// @route   DELETE /api/events/:eventId
// @desc    Delete event
// @access  Private/Admin
router.delete('/:eventId', protect, authorize('admin'), eventController.deleteEvent);

module.exports = router;
