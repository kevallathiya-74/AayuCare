const aiRoutes = require("./ai.routes");

const mount = (app) => {
  // Versioned route namespace
  app.use("/api/v1/ai", aiRoutes);

  // Backward-compatible namespace
  app.use("/api/ai", aiRoutes);
};

module.exports = {
  name: "ai",
  mount,
};