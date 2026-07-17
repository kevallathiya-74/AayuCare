const paymentRepository = require("./payment.repository");
const appointmentRepository = require("../appointment/appointment.repository");
const { AppError } = require("../../middleware/errorHandler");
const logger = require("../../utils/logger");
const crypto = require("crypto");

exports.processPayment = async ({
  appointmentId,
  amount,
  paymentMethod,
  purchaseType,
  patientId,
  userRole,
  isGatewayEnabled,
}) => {
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw new AppError("Amount must be a valid number greater than zero", 400);
  }

  const validMethods = ["card", "upi", "cash", "netbanking", "wallet", "online"];
  if (!validMethods.includes(paymentMethod)) {
    throw new AppError(`Invalid payment method. Allowed: ${validMethods.join(", ")}`, 400);
  }

  const appointment = await appointmentRepository.findById(appointmentId);
  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (appointment.patientId !== patientId && userRole !== "admin") {
    throw new AppError("Not authorized to pay for this appointment", 403);
  }

  if (!isGatewayEnabled) {
    return {
      success: true,
      statusCode: 200,
      status: "success",
      message: "Online payment is not active. Please pay at the clinic counter.",
      data: {
        paymentMode: "offline",
        instructions: "Show your appointment ID at the billing counter.",
        appointmentId: appointment.id,
      },
    };
  }

  const paymentId = crypto.randomUUID();
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

  if (paymentData.status !== "pending") {
    await paymentRepository.update(payment.id, {
      status: "completed",
      paid_at: new Date().toISOString(),
      transaction_id: `MOCK_TXN_${Date.now()}`,
      payment_gateway: "stub",
    });
  }

  const finalPayment = await paymentRepository.findById(payment.id);

  return {
    success: true,
    statusCode: 201,
    message: "Payment processed successfully",
    data: finalPayment || payment,
  };
};
