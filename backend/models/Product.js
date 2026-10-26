const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["laptop", "phone", "tablet", "appliance", "vehicle", "other"],
      default: "other",
    },
    description: { type: String, trim: true },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },

    // Ownership
    currentOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Blockchain
    blockchainTxHash: { type: String, default: null },
    blockchainBlockNumber: { type: Number, default: null },
    blockchainStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed", "not_submitted"],
      default: "not_submitted",
    },
    // Wallet address the contract has as owner (proxy address for local dev)
    ownerWalletAddress: { type: String, default: null },

    status: {
      type: String,
      enum: ["active", "inactive", "recalled"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Generate next product ID: RC-00001, RC-00002, etc.
ProductSchema.statics.generateProductId = async function () {
  const count = await this.countDocuments();
  return `RC-${String(count + 1).padStart(5, "0")}`;
};

module.exports = mongoose.model("Product", ProductSchema);
