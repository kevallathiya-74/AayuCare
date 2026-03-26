const appointmentRoutes = require("./appointment.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/appointments", appointmentRoutes);

  // Backward-compatible namespace
  app.use("/api/appointments", appointmentRoutes);
};

module.exports = {
  name: "appointment",
  mount,
};
