const doctorRoutes = require("./doctor.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/doctors", doctorRoutes);

  // Backward-compatible namespace
  app.use("/api/doctors", doctorRoutes);
};

module.exports = {
  name: "doctor",
  mount,
};
