const legacyEventController = require("../../controllers/eventController");
const eventService = require("./event.service");

exports.getUpcomingEvents = (req, res, next) => legacyEventController.getUpcomingEvents(req, res, next);
exports.getEventById = (req, res, next) => legacyEventController.getEventById(req, res, next);
exports.createEvent = (req, res, next) => legacyEventController.createEvent(req, res, next);
exports.registerForEvent = (req, res, next) => legacyEventController.registerForEvent(req, res, next);
exports.cancelRegistration = (req, res, next) => legacyEventController.cancelRegistration(req, res, next);
exports.updateEvent = (req, res, next) => legacyEventController.updateEvent(req, res, next);
exports.deleteEvent = (req, res, next) => legacyEventController.deleteEvent(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = eventService;