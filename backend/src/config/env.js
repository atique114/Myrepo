const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/digicoin-tracker",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  binanceApi: process.env.BINANCE_API || "https://api.binance.com",
  binanceApiKey: process.env.BINANCE_API_KEY || "",
  topCoinLimit: Number(process.env.TOP_COIN_LIMIT || 15),
  priceCheckCron: process.env.PRICE_CHECK_CRON || "*/5 * * * *",
  priceVsCurrency: process.env.PRICE_FETCH_VS_CURRENCY || "usdt",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpService: process.env.SMTP_SERVICE || "",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpSecure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
  emailFrom: process.env.EMAIL_FROM || "DigiCoin Tracker <no-reply@digicoin.local>",
  emailReplyTo: process.env.EMAIL_REPLY_TO || "",
  demoUserEmail: process.env.DEMO_USER_EMAIL || "demo@digicoin.local",
  demoUserPassword: process.env.DEMO_USER_PASSWORD || "demo123",
};

module.exports = env;
