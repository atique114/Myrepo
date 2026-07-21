const mongoose = require("mongoose");

const alertHistorySchema = new mongoose.Schema(
  {
    alert: { type: mongoose.Schema.Types.ObjectId, ref: "Alert", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coinId: { type: String, required: true, trim: true, lowercase: true },
    symbol: { type: String, required: true, trim: true, lowercase: true },
    triggerPrice: { type: Number, required: true },
    targetPrice: { type: Number, required: true },
    direction: { type: String, enum: ["ABOVE", "BELOW"], required: true },
    deliveryStatus: {
      type: String,
      enum: ["SENT", "FAILED", "SIMULATED"],
      required: true,
    },
    deliveryError: { type: String, default: null },
    triggeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

alertHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("AlertHistory", alertHistorySchema);
