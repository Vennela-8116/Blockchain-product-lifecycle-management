const mongoose = require("mongoose");

const OwnershipTransferSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      index: true,
    },
    fromOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toEmail: { type: String }, // snapshot of recipient email
    status: {
      type: String,
      enum: ["pending", "accepted", "cancelled", "failed"],
      default: "pending",
    },
    initiatedAt: { type: Date, default: Date.now },
    acceptedAt:  { type: Date, default: null },
    cancelledAt: { type: Date, default: null },

    // Blockchain — initiation
    initTxHash:        { type: String, default: null },
    initBlockNumber:   { type: Number, default: null },
    initBlockchainStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed", "not_submitted"],
      default: "not_submitted",
    },

    // Blockchain — acceptance
    acceptTxHash:        { type: String, default: null },
    acceptBlockNumber:   { type: Number, default: null },
    acceptBlockchainStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed", "not_submitted"],
      default: "not_submitted",
    },

    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OwnershipTransfer", OwnershipTransferSchema);
