const prescriptionRoutes = require("./prescription.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/prescriptions", prescriptionRoutes);

  // Backward-compatible namespace
  app.use("/api/prescriptions", prescriptionRoutes);
};

module.exports = {
  name: "prescription",
  mount,
};
