const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { sendPasswordResetEmail } = require("../services/email.service");
const { isDatabaseConnected } = require("../config/db");
const env = require("../config/env");

function getDemoUser() {
  return {
    _id: "demo-user",
    email: env.demoUserEmail,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    isDemo: true,
  };
}

function sanitizeUser(user) {
  return {
    id: user._id,
    email: user.email,
    createdAt: user.createdAt,
    isDemo: Boolean(user.isDemo),
  };
}

function makeAuthResponse(user) {
  return {
    token: signToken({
      sub: user._id.toString(),
      email: user.email,
      mode: user.isDemo ? "demo" : "database",
    }),
    user: sanitizeUser(user),
  };
}

async function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res
      .status(400)
      .json({ message: "Email and password (min 6 chars) are required." });
  }

  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message:
        "Signup requires MongoDB. Use the demo login while the database is offline.",
      demoCredentials: {
        email: env.demoUserEmail,
        password: env.demoUserPassword,
      },
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(409).json({ message: "User already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: email.toLowerCase(), passwordHash });
  return res.status(201).json(makeAuthResponse(user));
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  if (!isDatabaseConnected()) {
    const normalizedEmail = email.toLowerCase();
    if (
      normalizedEmail === env.demoUserEmail.toLowerCase() &&
      password === env.demoUserPassword
    ) {
      return res.json({
        ...makeAuthResponse(getDemoUser()),
        demoCredentials: {
          email: env.demoUserEmail,
          password: env.demoUserPassword,
        },
      });
    }

    return res.status(401).json({
      message:
        "MongoDB is offline. Sign in with the demo account until the database is available.",
      demoCredentials: {
        email: env.demoUserEmail,
        password: env.demoUserPassword,
      },
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  return res.json(makeAuthResponse(user));
}

async function me(req, res) {
  return res.json({ user: sanitizeUser(req.user) });
}

async function forgotPassword(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message: "Password reset is unavailable while MongoDB is offline.",
    });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({
      message:
        "If an account exists with this email, a reset token has been sent.",
    });
  }

  const rawToken = crypto.randomBytes(4).toString("hex").toUpperCase();
  const resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  user.resetTokenHash = resetTokenHash;
  user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  await sendPasswordResetEmail({ to: user.email, token: rawToken });

  const response = {
    message: "Reset token sent to your email address.",
  };

  if (process.env.NODE_ENV !== "production") {
    response.devResetToken = rawToken;
  }

  return res.json(response);
}

async function resetPassword(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message: "Password reset is unavailable while MongoDB is offline.",
    });
  }

  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Token and new password (min 6 chars) are required." });
  }

  const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetTokenHash,
    resetTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.resetTokenHash = null;
  user.resetTokenExpiry = null;
  await user.save();

  return res.json({ message: "Password reset successfully." });
}

async function changePassword(req, res) {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message: "Password changes are unavailable while MongoDB is offline.",
    });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({
      message: "Current password and new password (min 6 chars) are required.",
    });
  }

  const user = await User.findById(req.user._id);
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return res.status(400).json({ message: "Current password is incorrect." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  return res.json({ message: "Password updated." });
}

module.exports = {
  signup,
  login,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
};
