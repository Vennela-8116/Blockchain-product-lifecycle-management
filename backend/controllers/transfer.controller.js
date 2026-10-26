const mongoose = require("mongoose");
const { ethers } = require("ethers");
const OwnershipTransfer = require("../models/OwnershipTransfer");
const Product = require("../models/Product");
const User = require("../models/User");
const {
  initiateTransferOnChain,
  acceptTransferOnChain,
} = require("../config/blockchain");

/**
 * @desc    Initiate an ownership transfer (owner only)
 * @route   POST /api/transfers/initiate
 * @access  Private (Owner)
 */
const initiateTransfer = async (req, res, next) => {
  try {
    const { productId, toEmail, email, notes } = req.body;
    const recipientEmail = (toEmail || email || "").toLowerCase().trim();

    if (!productId || !recipientEmail) {
      return res.status(400).json({ error: "productId and recipient email are required" });
    }

    // 1. Find product by productId, verify currentOwner === req.user._id
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.currentOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Only the current product owner can initiate a transfer",
      });
    }

    // 2. Find toUser by email provided in body
    const toUser = await User.findOne({ email: recipientEmail });
    if (!toUser) {
      return res.status(404).json({ error: "Recipient user not found with that email" });
    }

    if (toUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot transfer product to yourself" });
    }

    // 3. Check no pending transfer exists for productId
    const pendingTransfer = await OwnershipTransfer.findOne({
      productId: product.productId,
      status: "pending",
    });
    if (pendingTransfer) {
      return res.status(400).json({
        error: "An ownership transfer is already pending for this product",
      });
    }

    // 4. Create OwnershipTransfer record status='pending'
    const transfer = new OwnershipTransfer({
      productId: product.productId,
      fromOwner: req.user._id,
      toOwner: toUser._id,
      toEmail: toUser.email,
      status: "pending",
      initiatedAt: new Date(),
      notes: notes || "",
      initBlockchainStatus: "pending",
    });
    await transfer.save();

    // 5. Call initiateTransferOnChain using admin wallet as proxy
    try {
      const targetWallet = toUser.walletAddress || ethers.ZeroAddress;
      const chainResult = await initiateTransferOnChain(product.productId, targetWallet);

      // 6. Update transfer initTxHash/blockNumber/initBlockchainStatus
      transfer.initTxHash = chainResult.txHash;
      transfer.initBlockNumber = chainResult.blockNumber;
      transfer.initBlockchainStatus = "confirmed";
      await transfer.save();
    } catch (chainErr) {
      console.error("Blockchain initiate transfer failed:", chainErr.message || chainErr);
      transfer.initBlockchainStatus = "failed";
      await transfer.save();
    }

    // 7. Return transfer
    const populated = await OwnershipTransfer.findById(transfer._id)
      .populate("fromOwner", "name email")
      .populate("toOwner", "name email");

    return res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Accept a pending ownership transfer (recipient only)
 * @route   POST /api/transfers/:transferId/accept
 * @access  Private (Owner)
 */
const acceptTransfer = async (req, res, next) => {
  try {
    const { transferId } = req.params;
    if (!mongoose.isValidObjectId(transferId)) {
      return res.status(400).json({ error: "Invalid transfer ID" });
    }

    // 1. Find transfer, verify toOwner === req.user._id and status='pending'
    const transfer = await OwnershipTransfer.findById(transferId);
    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    if (transfer.toOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Only the designated recipient can accept this transfer",
      });
    }

    if (transfer.status !== "pending") {
      return res.status(400).json({
        error: `Transfer is not pending (current status: ${transfer.status})`,
      });
    }

    // 2. Call acceptTransferOnChain(productId)
    try {
      const chainResult = await acceptTransferOnChain(transfer.productId);
      transfer.acceptTxHash = chainResult.txHash;
      transfer.acceptBlockNumber = chainResult.blockNumber;
      transfer.acceptBlockchainStatus = "confirmed";
    } catch (chainErr) {
      console.error("Blockchain accept transfer failed:", chainErr.message || chainErr);
      transfer.acceptBlockchainStatus = "failed";
    }

    // 3. Update Product.currentOwner = toOwner
    const product = await Product.findOne({ productId: transfer.productId });
    if (product) {
      product.currentOwner = transfer.toOwner;
      if (req.user.walletAddress) {
        product.ownerWalletAddress = req.user.walletAddress;
      }
      await product.save();
    }

    // 4. Update transfer status='accepted', acceptedAt=now, acceptTxHash, acceptBlockNumber
    transfer.status = "accepted";
    transfer.acceptedAt = new Date();
    await transfer.save();

    // 5. Return updated transfer
    const updated = await OwnershipTransfer.findById(transfer._id)
      .populate("fromOwner", "name email")
      .populate("toOwner", "name email");

    return res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a pending ownership transfer (initiator only)
 * @route   POST /api/transfers/:transferId/cancel
 * @access  Private (Owner)
 */
const cancelTransfer = async (req, res, next) => {
  try {
    const { transferId } = req.params;
    if (!mongoose.isValidObjectId(transferId)) {
      return res.status(400).json({ error: "Invalid transfer ID" });
    }

    // 1. Find transfer, verify fromOwner === req.user._id and status='pending'
    const transfer = await OwnershipTransfer.findById(transferId);
    if (!transfer) {
      return res.status(404).json({ error: "Transfer not found" });
    }

    if (transfer.fromOwner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: "Only the initiator can cancel this transfer",
      });
    }

    if (transfer.status !== "pending") {
      return res.status(400).json({
        error: `Transfer is not pending (current status: ${transfer.status})`,
      });
    }

    // 2. Update status='cancelled', cancelledAt=now
    transfer.status = "cancelled";
    transfer.cancelledAt = new Date();
    await transfer.save();

    // 3. Return transfer
    const updated = await OwnershipTransfer.findById(transfer._id)
      .populate("fromOwner", "name email")
      .populate("toOwner", "name email");

    return res.json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transfers for a specific product
 * @route   GET /api/transfers/product/:productId
 * @access  Private (Authenticated)
 */
const getProductTransfers = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const isAdmin = req.user && req.user.role === "admin";

    let query = OwnershipTransfer.find({ productId }).sort({ createdAt: -1 });

    if (isAdmin) {
      query = query
        .populate("fromOwner", "name email walletAddress")
        .populate("toOwner", "name email walletAddress");
    } else {
      query = query
        .populate("fromOwner", "name")
        .populate("toOwner", "name")
        .select("-toEmail");
    }

    const transfers = await query;
    return res.json(transfers);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's transfers (incoming & outgoing)
 * @route   GET /api/transfers/my
 * @access  Private (Owner)
 */
const getMyTransfers = async (req, res, next) => {
  try {
    const transfers = await OwnershipTransfer.find({
      $or: [{ fromOwner: req.user._id }, { toOwner: req.user._id }],
    })
      .populate("fromOwner", "name email")
      .populate("toOwner", "name email")
      .sort({ createdAt: -1 });

    // Populate product details
    const productIds = [...new Set(transfers.map((t) => t.productId))];
    const products = await Product.find({ productId: { $in: productIds } });
    const productMap = {};
    products.forEach((p) => {
      productMap[p.productId] = p;
    });

    const enriched = transfers.map((t) => {
      const obj = t.toObject();
      obj.product = productMap[t.productId] || null;
      return obj;
    });

    return res.json(enriched);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateTransfer,
  acceptTransfer,
  cancelTransfer,
  getProductTransfers,
  getMyTransfers,
};
