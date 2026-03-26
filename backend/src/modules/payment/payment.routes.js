const express = require("express");
const paymentController = require("./payment.controller");
const { protect, authorize } = require("../../middleware/auth");
const { attachHospitalId } = require("../../middleware/hospitalMiddleware");
const { validateBody } = require("../../middleware/validation");
const { createPaymentSchema } = require("../../validators/schemas");
const { cacheMiddleware } = require("../../middleware/cache");
const { idempotencyMiddleware } = require("../../middleware/idempotency");

const router = express.Router();

router.use(protect);
router.use(attachHospitalId);

router.post(
  "/",
  authorize("patient"),
  idempotencyMiddleware,
  validateBody(createPaymentSchema),
  paymentController.createPayment
);

router.get(
  "/stats",
  authorize("admin"),
  cacheMiddleware(60),
  paymentController.getPaymentStats
);

router.get(
  "/patient/:patientId",
  authorize("patient", "admin"),
  cacheMiddleware(30),
  paymentController.getPatientPayments
);

router.get(
  "/:id",
  authorize("patient", "doctor", "admin"),
  paymentController.getPaymentById
);

module.exports = router;