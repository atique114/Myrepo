const cron = require("node-cron");
const env = require("../config/env");
const { evaluateAndTriggerAlerts } = require("../services/alert.service");
const { isDatabaseConnected } = require("../config/db");

function startPriceMonitorJob() {
  cron.schedule(env.priceCheckCron, async () => {
    try {
      if (!isDatabaseConnected()) {
        console.warn("[alerts] Skipping monitor run (database unavailable)");
        return;
      }
      console.log(`[alerts] Running scheduled price monitor (${new Date().toISOString()})`);
      await evaluateAndTriggerAlerts();
    } catch (error) {
      console.error("[alerts] Monitor failed:", error.message);
    }
  });

  console.log(`[alerts] Monitor scheduled with CRON: ${env.priceCheckCron}`);
}

module.exports = { startPriceMonitorJob };
