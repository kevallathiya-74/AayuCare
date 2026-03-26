const adminRoutes = require("./admin.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/admin", adminRoutes);

  // Backward-compatible namespace
  app.use("/api/admin", adminRoutes);
};

module.exports = {
  name: "admin",
  mount,
};