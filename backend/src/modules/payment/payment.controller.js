/**
 * Payment Controller
 * Handles pharmacy billing and payment processing
 * Architecture: Controller → Service → Repository → Database (PostgreSQL)
 */

const paymentRepository = require("./payment.repository");
const { AppError } = require("../../middleware/errorHandler");
const logger = require("../../utils/logger");
const { writeAuditLog } = require("../../utils/audit");
const crypto = require("crypto");
const { invalidateByPatterns, PAYMENT_CACHE_PATTERNS } = require('../../utils/cacheInvalidation');

/**
 * Create a new payment record (pharmacy billing)
 * POST /payments
 */
exports.createPayment = async (req, res, next) => {
  try {
    const { appointmentId, amount, paymentMethod, purchaseType } = req.body;
    const patientId = req.user?.id;
    const hospitalId = req.hospitalId;

    if (!patientId) {
      return next(new AppError("Authentication required", 401));
    }

    if (!amount || !paymentMethod) {
      return next(new AppError("Amount and payment method are required", 400));
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return next(new AppError("Amount must be a valid number greater than zero", 400));
    }

    const validMethods = ["card", "upi", "cash", "netbanking", "wallet", "online"];
    if (!validMethods.includes(paymentMethod)) {
      return next(
        new AppError(
          `Invalid payment method. Allowed: ${validMethods.join(", ")}`,
          400,
        ),
      );
    }

    // Must fetch appointment to get doctorId since payments table requires it
    const appointmentRepository = require("../appointment/appointment.repository");
    const appointment = await appointmentRepository.findById(appointmentId);
    if (!appointment) {
      return next(new AppError("Appointment not found", 404));
    }
    
    // Ensure patient owns this appointment
    if (appointment.patientId !== patientId && req.user.role !== "admin") {
      return next(new AppError("Not authorized to pay for this appointment", 403));
    }

    const paymentId = crypto.randomUUID();
    const isGatewayEnabled = process.env.PAYMENT_GATEWAY_ENABLED === "true";

    if (!isGatewayEnabled) {
      return res.status(200).json({
        success: true,
        status: "success",
        message: "Online payment is not active. Please pay at the clinic counter.",
        data: {
          paymentMode: "offline",
          instructions: "Show your appointment ID at the billing counter.",
          appointmentId: appointment.id,
        }
      });
    }

    const paymentData = {
      paymentId,
      appointmentId: appointment.id,
      patientId,
      doctorId: appointment.doctorId,
      amount: parsedAmount,
      currency: "INR",
      paymentMethod,
      status: paymentMethod === "cash" ? "pending" : "completed",
    };

    const payment = await paymentRepository.create(paymentData);

    if (!paymentData.status || paymentData.status === "pending") {
      // Cash payment — mark as pending
    } else {
      // Card/UPI
      if (isGatewayEnabled) {
        // Future integration with Razorpay/Stripe
        // E.g. creating a payment intent and returning client_secret
        logger.info(
          "Payment gateway is enabled - initializing real payment intent",
        );
      } else {
        // Development stub: auto-complete the payment
        await paymentRepository.update(payment.id, {
          status: "completed",
          paid_at: new Date().toISOString(),
          transaction_id: `MOCK_TXN_${Date.now()}`,
          payment_gateway: "stub",
        });
      }
    }

    // Re-fetch with updated status
    const finalPayment = await paymentRepository.findById(payment.id);

    // Invalidate payment-related caches after creation
    try {
      await invalidateByPatterns(PAYMENT_CACHE_PATTERNS);
    } catch (cacheError) {
      logger.warn("Failed to invalidate cache:", cacheError.message);
    }

    await writeAuditLog({
      userId: patientId,
      action: "PAYMENT_CREATED",
      entity: "payment",
      entityId: payment.id,
      details: {
        amount,
        paymentMethod,
        purchaseType,
        hospitalId,
      },
    });

    logger.info(`Payment created: ${payment.id} for patient ${patientId}`);

    return res.status(201).json({ success: true, message: "Payment processed successfully", data: finalPayment || payment });
  } catch (error) {
    logger.error("createPayment error:", error);
    next(error);
  }
};

/**
 * Get payment history for patient
 * GET /payments/patient/:patientId
 */
exports.getPatientPayments = async (req, res, next) => {
  try {
    const requestingUser = req.user;

    // Determine which patient's payments to fetch:
    // - Patients can only view their own payments (ignore URL param)
    // - Admins/other roles can view any patient's payments via path param
    let patientIdToQuery;
    if (requestingUser.role === "patient") {
      patientIdToQuery = requestingUser.id;
    } else {
      // Path parameter `:patientId` (declared in payment.routes.js) — not body
      patientIdToQuery = req.params.patientId;
    }

    if (!patientIdToQuery) {
      return next(new AppError("Patient identifier is required", 400));
    }

    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;
    const filters = { status, startDate, endDate, limit: limitNum, offset };

    // Parallelize the page query and the count query so pagination `total`
    // is the true record count, not the page size.
    const [payments, total] = await Promise.all([
      paymentRepository.findByPatient(patientIdToQuery, filters),
      paymentRepository.countByPatient(patientIdToQuery, filters),
    ]);

    return res.status(200).json({
      success: true,
      status: "success",
      message: "Patient payments retrieved successfully",

      data: {
        payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
        },
      }
    });
  } catch (error) {
    logger.error("getPatientPayments error:", error);
    next(error);
  }
};

/**
 * Get single payment by ID
 * GET /payments/:id
 */
exports.getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    const payment = await paymentRepository.findById(id);

    if (!payment) {
      return next(new AppError("Payment not found", 404));
    }

    // Patients can only view their own payments
    if (
      requestingUser.role === "patient" &&
      payment.patient_id !== requestingUser.id
    ) {
      return next(new AppError("Access denied", 403));
    }

    return res.status(200).json({ success: true, message: "Payment retrieved successfully", data: payment });
  } catch (error) {
    logger.error("getPaymentById error:", error);
    next(error);
  }
};

/**
 * Get payment statistics (admin only)
 * GET /payments/stats
 */
exports.getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate, doctorId } = req.query;
    const hospitalId = req.hospitalId;

    const stats = await paymentRepository.getStatistics({
      hospitalId,
      doctorId,
      startDate,
      endDate,
    });

    return res.status(200).json({ success: true, message: "Payment stats retrieved successfully", data: stats });
  } catch (error) {
    logger.error("getPaymentStats error:", error);
    next(error);
  }
};
