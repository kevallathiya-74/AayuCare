const express = require("express");
const router = express.Router();
const eventController = require("./event.controller");
const { protect, authorize, optionalAuth } = require("../../middleware/auth");
const { attachHospitalId } = require("../../middleware/hospitalMiddleware");
const { validateBody } = require("../../middleware/validation");
const { createEventSchema, updateEventSchema } = require("../../validators/schemas");
const { cacheMiddleware } = require("../../middleware/cache");

router.get("/", optionalAuth, cacheMiddleware(300), eventController.getUpcomingEvents);
router.get("/:eventId", optionalAuth, cacheMiddleware(300), eventController.getEventById);

router.post("/:eventId/register", protect, attachHospitalId, eventController.registerForEvent);
router.delete("/:eventId/register", protect, attachHospitalId, eventController.cancelRegistration);

router.post(
  "/",
  protect,
  authorize("admin"),
  validateBody(createEventSchema),
  eventController.createEvent
);

router.put(
  "/:eventId",
  protect,
  authorize("admin"),
  validateBody(updateEventSchema),
  eventController.updateEvent
);

router.delete("/:eventId", protect, authorize("admin"), eventController.deleteEvent);

module.exports = router;