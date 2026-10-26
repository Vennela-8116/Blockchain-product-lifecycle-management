const mongoose = require("mongoose");

const ServiceCenterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name:         { type: String, required: true, trim: true },
    address:      { type: String, trim: true },
    city:         { type: String, trim: true },
    country:      { type: String, trim: true, default: "US" },
    contactEmail: { type: String, lowercase: true, trim: true },
    phone:        { type: String, trim: true },
    specializations: [{ type: String }],

    // Blockchain identity — the wallet the service center uses to sign txns
    walletAddress: {
      type: String,
      required: true,
      unique: true,
    },

    isAuthorized:  { type: Boolean, default: false },
    authorizedAt:  { type: Date, default: null },
    deactivatedAt: { type: Date, default: null },

    // Blockchain authorization tx
    authTxHash:      { type: String, default: null },
    authBlockNumber: { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ServiceCenter", ServiceCenterSchema);
