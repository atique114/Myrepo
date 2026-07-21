const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");
const env = require("../config/env");
const { isDatabaseConnected } = require("../config/db");

async function authRequired(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = verifyToken(token);
    if (payload.mode === "demo") {
      req.user = {
        _id: "demo-user",
        email: env.demoUserEmail,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        isDemo: true,
      };
      return next();
    }

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        message: "Database is unavailable. Please start MongoDB and try again.",
      });
    }

    const user = await User.findById(payload.sub).select("-passwordHash");

    if (!user) {
      return res.status(401).json({ message: "Invalid token." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = { authRequired };
