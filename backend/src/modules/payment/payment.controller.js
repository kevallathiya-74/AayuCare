const legacyPaymentController = require("../../controllers/paymentController");
const paymentService = require("./payment.service");

exports.createPayment = (req, res, next) => legacyPaymentController.createPayment(req, res, next);
exports.getPaymentStats = (req, res, next) => legacyPaymentController.getPaymentStats(req, res, next);
exports.getPatientPayments = (req, res, next) => legacyPaymentController.getPatientPayments(req, res, next);
exports.getPaymentById = (req, res, next) => legacyPaymentController.getPaymentById(req, res, next);

// Migration seam for new logic: module controllers should call module services.
exports.__service = paymentService;