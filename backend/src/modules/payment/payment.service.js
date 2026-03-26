const paymentRepository = require("./payment.repository");

const paymentService = {
  repository: paymentRepository,
};

module.exports = paymentService;