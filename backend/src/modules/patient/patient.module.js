const patientRoutes = require("./patient.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/patients", patientRoutes);

  // Backward-compatible namespace
  app.use("/api/patients", patientRoutes);
};

module.exports = {
  name: "patient",
  mount,
};
