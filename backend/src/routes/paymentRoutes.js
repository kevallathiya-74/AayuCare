/**
 * Payment Routes
 * Routes for pharmacy billing and payment management
 */

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/auth");
const { attachHospitalId } = require("../middleware/hospitalMiddleware");
const { validateBody } = require("../middleware/validation");
const { createPaymentSchema } = require("../validators/schemas");
const { cacheMiddleware } = require("../middleware/cache");

// All routes require authentication
router.use(protect);
router.use(attachHospitalId);

// @route   POST /api/payments
// @desc    Create a new payment (pharmacy billing)
// @access  Private (Patient only)
router.post("/", authorize("patient"), validateBody(createPaymentSchema), paymentController.createPayment);

// @route   GET /api/payments/stats
// @desc    Get payment statistics
// @access  Private (Admin only)
router.get(
  "/stats",
  authorize("admin"),
  cacheMiddleware(60),
  paymentController.getPaymentStats
);

// @route   GET /api/payments/patient/:patientId
// @desc    Get payment history for a patient
// @access  Private (Patient own data or Admin)
router.get(
  "/patient/:patientId",
  authorize("patient", "admin"),
  cacheMiddleware(30),
  paymentController.getPatientPayments
);

// @route   GET /api/payments/:id
// @desc    Get single payment by ID
// @access  Private (Patient own data, Doctor, or Admin)
router.get(
  "/:id",
  authorize("patient", "doctor", "admin"),
  paymentController.getPaymentById
);

module.exports = router;
