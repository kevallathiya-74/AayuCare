const scheduleRoutes = require("./schedule.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/schedules", scheduleRoutes);

  // Backward-compatible namespace
  app.use("/api/schedules", scheduleRoutes);
};

module.exports = {
  name: "schedule",
  mount,
};