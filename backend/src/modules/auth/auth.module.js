const authRoutes = require("./auth.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/user", authRoutes);

  // Backward-compatible namespace
  app.use("/api/user", authRoutes);
};

module.exports = {
  name: "auth",
  mount,
};
