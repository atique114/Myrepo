const nodemailer = require("nodemailer");
const env = require("../config/env");

const PLACEHOLDER_VALUES = new Set([
  "",
  "yourgmail@gmail.com",
  "your_google_app_password",
]);

function isUsableConfigValue(value) {
  return !PLACEHOLDER_VALUES.has(String(value || "").trim().toLowerCase());
}

function hasSmtpCredentials() {
  return Boolean(
    (env.smtpService || env.smtpHost) &&
      isUsableConfigValue(env.smtpUser) &&
      isUsableConfigValue(env.smtpPass)
  );
}

function buildTransporter() {
  if (!hasSmtpCredentials()) return null;

  const secure = env.smtpSecure || env.smtpPort === 465;
  const normalizedService = String(env.smtpService || "").toLowerCase();
  const useGmailService =
    normalizedService === "gmail" || env.smtpHost.toLowerCase() === "smtp.gmail.com";

  const transportConfig = useGmailService
    ? {
        service: "gmail",
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      }
    : {
        host: env.smtpHost,
        port: env.smtpPort,
        secure,
        auth: {
          user: env.smtpUser,
          pass: env.smtpPass,
        },
      };

  return nodemailer.createTransport(transportConfig);
}

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = buildTransporter();
  }
  return transporter;
}

function getFromAddress() {
  if (env.emailFrom && !env.emailFrom.includes("no-reply@digicoin.local")) {
    return env.emailFrom;
  }

  if (env.smtpUser) {
    return `DigiCoin Tracker <${env.smtpUser}>`;
  }

  return env.emailFrom;
}

async function sendEmail({ to, subject, html }) {
  const activeTransporter = getTransporter();
  if (!activeTransporter) {
    console.warn(
      "[email] SMTP is not fully configured. Add a real Gmail address to SMTP_USER and a Google App Password to SMTP_PASS in backend/.env."
    );
    console.log("[email:simulated]", { to, subject });
    return { status: "SIMULATED" };
  }

  try {
    await activeTransporter.sendMail({
      from: getFromAddress(),
      replyTo: env.emailReplyTo || undefined,
      to,
      subject,
      html,
    });
  } catch (error) {
    if (error && error.code === "EAUTH") {
      error.message =
        "SMTP authentication failed. For Gmail, use your Gmail address in SMTP_USER and a Google App Password in SMTP_PASS.";
    }
    throw error;
  }

  return { status: "SENT" };
}

async function sendPriceAlertEmail({ to, coinName, symbol, currentPrice, targetPrice, direction }) {
  const directionText = direction === "ABOVE" ? "rose above" : "fell below";
  const subject = `DigiCoin Alert: ${coinName} ${directionText} your target`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 10px">DigiCoin Tracker Alert</h2>
      <p><strong>${coinName} (${symbol.toUpperCase()})</strong> has ${directionText} your configured threshold.</p>
      <p>Current price: <strong>$${Number(currentPrice).toLocaleString()}</strong></p>
      <p>Alert target: <strong>$${Number(targetPrice).toLocaleString()}</strong></p>
      <p style="margin-top:14px">Open DigiCoin Tracker to manage your alerts.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

async function sendPasswordResetEmail({ to, token }) {
  const subject = "DigiCoin Tracker Password Reset";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
      <h2 style="margin:0 0 10px">Reset your password</h2>
      <p>Use this reset token in the app to set a new password:</p>
      <p style="font-size:18px;font-weight:700;letter-spacing:1px">${token}</p>
      <p>This token expires in 15 minutes.</p>
    </div>
  `;
  return sendEmail({ to, subject, html });
}

module.exports = {
  sendPriceAlertEmail,
  sendPasswordResetEmail,
};
