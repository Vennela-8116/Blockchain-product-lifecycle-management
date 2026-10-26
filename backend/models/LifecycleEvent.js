const mongoose = require("mongoose");

const PartSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },
    partNumber:   { type: String },
    manufacturer: { type: String },
    condition:    { type: String, enum: ["new", "refurbished", "oem"], default: "new" },
  },
  { _id: false }
);

const LifecycleEventSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ["REPAIR", "MAINTENANCE", "INSPECTION", "COMPONENT_REPLACEMENT", "WARRANTY_CLAIM", "OTHER"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },

    // Service center info
    serviceCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceCenter",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    technicianName: { type: String },

    // Repair details
    parts: [PartSchema],
    laborCost: { type: Number, default: 0 },
    partsCost: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },

    // Timing
    serviceDate: { type: Date, required: true },
    completionDate: { type: Date },

    // Blockchain
    canonicalJson: { type: String },   // The exact string that was hashed
    eventHash: { type: String },       // keccak256 hash (hex string)
    blockchainTxHash: { type: String, default: null },
    blockchainBlockNumber: { type: Number, default: null },
    blockchainEventIndex: { type: Number, default: null }, // index in contract array
    blockchainStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed", "not_submitted"],
      default: "pending",
    },
    blockchainError: { type: String, default: null },
    retryCount: { type: Number, default: 0 },

    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LifecycleEvent", LifecycleEventSchema);
