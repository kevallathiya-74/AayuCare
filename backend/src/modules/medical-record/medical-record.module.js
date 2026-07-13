const medicalRecordRoutes = require("./medical-record.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/medical-records", medicalRecordRoutes);

  // Backward-compatible namespace
  app.use("/api/medical-records", medicalRecordRoutes);
};

module.exports = {
  name: "medical-record",
  mount,
};
