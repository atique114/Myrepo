const Alert = require("../models/Alert");
const AlertHistory = require("../models/AlertHistory");
const { isDatabaseConnected } = require("../config/db");

async function profileSummary(req, res) {
  if (req.user?.isDemo || !isDatabaseConnected()) {
    return res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        createdAt: req.user.createdAt,
        isDemo: true,
      },
      stats: {
        activeAlerts: 0,
        totalAlerts: 0,
        triggeredAlerts: 0,
      },
    });
  }

  const [activeAlerts, totalAlerts, triggeredCount] = await Promise.all([
    Alert.countDocuments({ user: req.user._id, isActive: true }),
    Alert.countDocuments({ user: req.user._id }),
    AlertHistory.countDocuments({ user: req.user._id }),
  ]);

  return res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      createdAt: req.user.createdAt,
    },
    stats: {
      activeAlerts,
      totalAlerts,
      triggeredAlerts: triggeredCount,
    },
  });
}

module.exports = { profileSummary };
