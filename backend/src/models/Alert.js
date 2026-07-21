const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coinId: { type: String, required: true, trim: true, lowercase: true },
    coinName: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, trim: true, lowercase: true },
    direction: {
      type: String,
      enum: ["ABOVE", "BELOW"],
      required: true,
    },
    targetPrice: { type: Number, required: true, min: 0 },
    cooldownMinutes: { type: Number, default: 30, min: 1, max: 1440 },
    isActive: { type: Boolean, default: true },
    lastTriggeredPrice: { type: Number, default: null },
    lastTriggeredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

alertSchema.index({ user: 1, coinId: 1, direction: 1, targetPrice: 1 });

module.exports = mongoose.model("Alert", alertSchema);
