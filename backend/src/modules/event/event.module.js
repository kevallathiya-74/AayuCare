const eventRoutes = require("./event.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/events", eventRoutes);

  // Backward-compatible namespace
  app.use("/api/events", eventRoutes);
};

module.exports = {
  name: "event",
  mount,
};