const app = require("./app");
const env = require("./config/env");
const { connectDatabase } = require("./config/db");
const { startPriceMonitorJob } = require("./jobs/priceMonitor.job");

async function bootstrap() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`[server] DigiCoin backend running on http://localhost:${env.port}`);
  });
  startPriceMonitorJob();
}

bootstrap().catch((error) => {
  console.error("[bootstrap] Failed to start server:", error);
  process.exit(1);
});
