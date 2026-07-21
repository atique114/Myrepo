const { isDatabaseConnected } = require("../config/db");

function dbRequired(req, res, next) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message:
        "Database is unavailable. Please start MongoDB and try again.",
    });
  }
  return next();
}

module.exports = { dbRequired };
