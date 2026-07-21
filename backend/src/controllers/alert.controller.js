const Alert = require("../models/Alert");
const AlertHistory = require("../models/AlertHistory");
const { evaluateAlertById } = require("../services/alert.service");

function mapAlert(alert) {
  return {
    id: alert._id,
    coinId: alert.coinId,
    coinName: alert.coinName,
    symbol: alert.symbol,
    direction: alert.direction,
    targetPrice: alert.targetPrice,
    cooldownMinutes: alert.cooldownMinutes,
    isActive: alert.isActive,
    lastTriggeredPrice: alert.lastTriggeredPrice,
    lastTriggeredAt: alert.lastTriggeredAt,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
}

async function listAlerts(req, res) {
  const isActiveParam = req.query.active;
  const filter = { user: req.user._id };
  if (isActiveParam === "true") filter.isActive = true;
  if (isActiveParam === "false") filter.isActive = false;

  const alerts = await Alert.find(filter).sort({ createdAt: -1 });
  return res.json({ alerts: alerts.map(mapAlert) });
}

async function createAlert(req, res) {
  const { coinId, coinName, symbol, direction, targetPrice, cooldownMinutes } = req.body;

  if (!coinId || !coinName || !symbol) {
    return res.status(400).json({ message: "coinId, coinName, and symbol are required." });
  }

  if (![
    "ABOVE",
    "BELOW",
  ].includes(direction)) {
    return res.status(400).json({ message: "direction must be ABOVE or BELOW." });
  }

  if (typeof targetPrice !== "number" || Number.isNaN(targetPrice) || targetPrice <= 0) {
    return res.status(400).json({ message: "targetPrice must be a positive number." });
  }

  const alert = await Alert.create({
    user: req.user._id,
    coinId: coinId.toLowerCase(),
    coinName,
    symbol: symbol.toLowerCase(),
    direction,
    targetPrice,
    cooldownMinutes: cooldownMinutes || 30,
    isActive: true,
  });

  const evaluation = await evaluateAlertById(alert._id);
  if (evaluation.deleted) {
    return res.status(201).json({
      alert: null,
      triggered: true,
      deliveryStatus: evaluation.deliveryStatus,
      deliveryError: evaluation.deliveryError || null,
      message:
        evaluation.deliveryStatus === "SENT"
          ? "Alert target was already met. Email sent and alert removed automatically."
          : "Alert target was already met. The alert was removed and the delivery result was recorded in history.",
    });
  }

  const freshAlert = await Alert.findById(alert._id);
  return res.status(201).json({
    alert: freshAlert ? mapAlert(freshAlert) : null,
    triggered: Boolean(evaluation.triggered),
  });
}

async function updateAlert(req, res) {
  const { id } = req.params;
  const alert = await Alert.findOne({ _id: id, user: req.user._id });
  if (!alert) return res.status(404).json({ message: "Alert not found." });

  const allowed = ["direction", "targetPrice", "cooldownMinutes", "isActive"];
  for (const key of allowed) {
    if (key in req.body) alert[key] = req.body[key];
  }

  if (![
    "ABOVE",
    "BELOW",
  ].includes(alert.direction)) {
    return res.status(400).json({ message: "direction must be ABOVE or BELOW." });
  }

  if (typeof alert.targetPrice !== "number" || alert.targetPrice <= 0) {
    return res.status(400).json({ message: "targetPrice must be a positive number." });
  }

  await alert.save();
  const evaluation = await evaluateAlertById(alert._id);
  if (evaluation.deleted) {
    return res.json({
      alert: null,
      triggered: true,
      deliveryStatus: evaluation.deliveryStatus,
      deliveryError: evaluation.deliveryError || null,
      message:
        evaluation.deliveryStatus === "SENT"
          ? "Updated alert hit the target immediately. Email sent and alert removed automatically."
          : "Updated alert hit the target immediately. The alert was removed and the delivery result was recorded in history.",
    });
  }

  const freshAlert = await Alert.findById(alert._id);
  return res.json({
    alert: freshAlert ? mapAlert(freshAlert) : null,
    triggered: Boolean(evaluation.triggered),
  });
}

async function deleteAlert(req, res) {
  const { id } = req.params;
  const deleted = await Alert.findOneAndDelete({ _id: id, user: req.user._id });
  if (!deleted) return res.status(404).json({ message: "Alert not found." });
  return res.json({ message: "Alert deleted." });
}

async function listAlertHistory(req, res) {
  const history = await AlertHistory.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);

  return res.json({
    history: history.map((entry) => ({
      id: entry._id,
      alertId: entry.alert,
      coinId: entry.coinId,
      symbol: entry.symbol,
      triggerPrice: entry.triggerPrice,
      targetPrice: entry.targetPrice,
      direction: entry.direction,
      deliveryStatus: entry.deliveryStatus,
      deliveryError: entry.deliveryError,
      triggeredAt: entry.triggeredAt,
    })),
  });
}

module.exports = {
  listAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  listAlertHistory,
};
