/**
 * Payment Controller
 * Handles pharmacy billing and payment processing
 * Architecture: Controller → Service → Repository → Database (PostgreSQL)
 */

const paymentRepository = require("../repositories/paymentRepository");
const { AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");
const { writeAuditLog } = require("../utils/audit");
const crypto = require("crypto");

/**
 * Create a new payment record (pharmacy billing)
 * POST /payments
 */
exports.createPayment = async (req, res, next) => {
  try {
    const { prescriptionId, amount, paymentMethod, purchaseType, medicines } =
      req.body;
    const patientId = req.user?.id;
    const hospitalId = req.hospitalId;

    if (!patientId) {
      return next(new AppError("Authentication required", 401));
    }

    if (!amount || !paymentMethod) {
      return next(new AppError("Amount and payment method are required", 400));
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return next(new AppError("Amount must be a valid number", 400));
    }
    if (parsedAmount <= 0) {
      return next(new AppError("Amount must be greater than zero", 400));
    }

    const validMethods = ["card", "upi", "cash", "netbanking", "wallet"];
    if (!validMethods.includes(paymentMethod)) {
      return next(
        new AppError(
          `Invalid payment method. Allowed: ${validMethods.join(", ")}`,
          400
        )
      );
    }

    const paymentId = crypto.randomUUID();

    const paymentData = {
      paymentId,
      patientId,
      amount: parsedAmount,
      currency: "INR",
      paymentMethod,
      status: paymentMethod === "cash" ? "pending" : "completed",
      ...(prescriptionId && { prescriptionId }),
      ...(purchaseType && { purchaseType }),
    };

    // For non-cash methods, mark as completed immediately
    // In production, integrate with Razorpay/Stripe here
    const payment = await paymentRepository.create(paymentData);

    if (!paymentData.status || paymentData.status === "pending") {
      // Cash payment — mark as pending
    } else {
      // Card/UPI — mark as completed
      await paymentRepository.update(payment.id, {
        status: "completed",
        paid_at: new Date().toISOString(),
        transaction_id: `TXN_${Date.now()}`,
      });
    }

    // Re-fetch with updated status
    const finalPayment = await paymentRepository.findById(payment.id);

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

    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      data: finalPayment || payment,
    });
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
      const { patientId } = req.body;
      patientIdToQuery = patientId;
    }

    if (!patientIdToQuery) {
      return next(new AppError("Patient identifier is required", 400));
    }

    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const payments = await paymentRepository.findByPatient(patientIdToQuery, {
      status,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: payments.length,
      },
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

    res.status(200).json({
      success: true,
      data: payment,
    });
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

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("getPaymentStats error:", error);
    next(error);
  }
};
