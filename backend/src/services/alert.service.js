const Alert = require("../models/Alert");
const AlertHistory = require("../models/AlertHistory");
const { fetchLatestPrices } = require("./marketData.service");
const { sendPriceAlertEmail } = require("./email.service");

function isCooldownComplete(alert) {
  if (!alert.lastTriggeredAt) return true;
  const cooldownMs = alert.cooldownMinutes * 60 * 1000;
  return Date.now() - new Date(alert.lastTriggeredAt).getTime() >= cooldownMs;
}

function isAlertTriggered(alert, currentPrice) {
  if (alert.direction === "ABOVE") {
    return currentPrice >= alert.targetPrice;
  }
  return currentPrice <= alert.targetPrice;
}

async function processTriggeredAlert(alert, currentPrice) {
  let deliveryStatus = "FAILED";
  let deliveryError = null;
  let emailDelivered = false;

  try {
    if (!alert.user?.email) {
      throw new Error("Recipient email is unavailable for this alert.");
    }

    const emailResult = await sendPriceAlertEmail({
      to: alert.user.email,
      coinName: alert.coinName,
      symbol: alert.symbol,
      currentPrice,
      targetPrice: alert.targetPrice,
      direction: alert.direction,
    });
    deliveryStatus = emailResult.status;
    emailDelivered = deliveryStatus === "SENT" || deliveryStatus === "SIMULATED";
  } catch (error) {
    deliveryError = error.message;
  }

  await AlertHistory.create({
    alert: alert._id,
    user: alert.user._id,
    coinId: alert.coinId,
    symbol: alert.symbol,
    triggerPrice: currentPrice,
    targetPrice: alert.targetPrice,
    direction: alert.direction,
    deliveryStatus,
    deliveryError,
  });

  await Alert.deleteOne({ _id: alert._id });
  return {
    triggered: true,
    deliveryStatus,
    deleted: true,
    deliveryError,
    delivered: emailDelivered,
  };
}

async function evaluateAlert(alert) {
  if (!alert || !alert.isActive) {
    return { processed: 0, triggered: false, reason: "inactive" };
  }

  const prices = await fetchLatestPrices([alert.coinId]);
  const currentPrice = prices?.[alert.coinId];

  if (typeof currentPrice !== "number") {
    return { processed: 1, triggered: false, reason: "price_unavailable" };
  }

  if (!isCooldownComplete(alert)) {
    return { processed: 1, triggered: false, reason: "cooldown" };
  }

  if (!isAlertTriggered(alert, currentPrice)) {
    return { processed: 1, triggered: false, reason: "threshold_not_met" };
  }

  const result = await processTriggeredAlert(alert, currentPrice);
  return { processed: 1, ...result };
}

async function evaluateAlertById(alertId) {
  const alert = await Alert.findById(alertId).populate("user");
  if (!alert) {
    return { processed: 0, triggered: false, reason: "missing" };
  }

  return evaluateAlert(alert);
}

async function evaluateAndTriggerAlerts() {
  const activeAlerts = await Alert.find({ isActive: true }).populate("user");
  if (!activeAlerts.length) {
    console.log("[alerts] No active alerts found");
    return { processed: 0, triggered: 0 };
  }

  const uniqueCoinIds = [...new Set(activeAlerts.map((alert) => alert.coinId))];
  const prices = await fetchLatestPrices(uniqueCoinIds);
  let triggeredCount = 0;

  for (const alert of activeAlerts) {
    const currentPrice = prices?.[alert.coinId];
    if (typeof currentPrice !== "number") continue;
    if (!isCooldownComplete(alert)) continue;
    if (!isAlertTriggered(alert, currentPrice)) continue;
    await processTriggeredAlert(alert, currentPrice);
    triggeredCount += 1;
  }

  console.log(`[alerts] Processed ${activeAlerts.length}, triggered ${triggeredCount}`);
  return { processed: activeAlerts.length, triggered: triggeredCount };
}

module.exports = {
  evaluateAlert,
  evaluateAlertById,
  evaluateAndTriggerAlerts,
};
