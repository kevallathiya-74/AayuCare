const notificationRoutes = require("./notification.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/notifications", notificationRoutes);

  // Backward-compatible namespace
  app.use("/api/notifications", notificationRoutes);
};

module.exports = {
  name: "notification",
  mount,
};