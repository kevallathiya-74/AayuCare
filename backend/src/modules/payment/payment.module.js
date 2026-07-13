const paymentRoutes = require("./payment.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/payments", paymentRoutes);

  // Backward-compatible namespace
  app.use("/api/payments", paymentRoutes);
};

module.exports = {
  name: "payment",
  mount,
};
