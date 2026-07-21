const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");

const authRoutes = require("./routes/auth.routes");
const alertRoutes = require("./routes/alert.routes");
const marketRoutes = require("./routes/market.routes");
const profileRoutes = require("./routes/profile.routes");
const { isDatabaseConnected } = require("./config/db");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.nodeEnv === "production" ? env.frontendUrl : true,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "digicoin-backend",
    database: isDatabaseConnected() ? "connected" : "disconnected",
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/profile", profileRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  console.error("[api-error]", error);
  const status = error.status || error.statusCode || 500;
  return res.status(status).json({
    message: status === 500 ? "Internal server error." : error.message,
    detail: env.nodeEnv === "production" ? undefined : error.message,
  });
});

module.exports = app;
