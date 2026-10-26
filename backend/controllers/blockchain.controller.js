const mongoose = require("mongoose");
const LifecycleEvent = require("../models/LifecycleEvent");
const {
  isBlockchainAvailable,
  getCurrentBlock,
  getTxReceipt,
  computeEventHash,
  verifyEventHashOnChain,
} = require("../config/blockchain");

/**
 * @desc    Get blockchain connection status and contract address
 * @route   GET /api/blockchain/status
 * @access  Private (Admin)
 */
const getStatus = async (_req, res, next) => {
  try {
    const available = await isBlockchainAvailable();
    let blockNumber = null;

    if (available) {
      try {
        blockNumber = await getCurrentBlock();
      } catch (err) {
        console.error("Error reading block number:", err.message);
      }
    }

    return res.json({
      available,
      blockNumber,
      contractAddress: process.env.CONTRACT_ADDRESS || null,
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || "http://127.0.0.1:8545",
      network: "localhost (Hardhat)",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get transaction receipt from chain
 * @route   GET /api/blockchain/tx/:hash
 * @access  Private (Admin)
 */
const getTxByHash = async (req, res, next) => {
  try {
    const { hash } = req.params;
    if (!hash || !/^0x([A-Fa-f0-9]{64})$/.test(hash)) {
      return res.status(400).json({ error: "Invalid transaction hash format" });
    }

    const receipt = await getTxReceipt(hash);
    if (!receipt) {
      return res.status(404).json({
        error: "Transaction receipt not found or not yet mined",
      });
    }

    return res.json(receipt);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify event hash against chain (public endpoint)
 * @route   GET /api/blockchain/verify-event/:eventId
 * @access  Public
 */
const verifyEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const event = await LifecycleEvent.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: "Lifecycle event not found" });
    }

    if (!event.canonicalJson) {
      return res.status(400).json({
        verified: false,
        error: "Event canonical data missing",
      });
    }

    const storedHash = computeEventHash(event.canonicalJson);

    if (event.blockchainStatus !== "confirmed") {
      return res.json({
        verified: false,
        storedHash,
        chainHash: null,
        txHash: event.blockchainTxHash,
        blockNumber: event.blockchainBlockNumber,
        status: event.blockchainStatus,
      });
    }

    let verified = false;
    if (event.blockchainEventIndex !== null && event.blockchainEventIndex !== undefined) {
      verified = await verifyEventHashOnChain(
        event.productId,
        event.blockchainEventIndex,
        storedHash
      );
    } else {
      for (let i = 0; i < 20; i++) {
        const isMatch = await verifyEventHashOnChain(event.productId, i, storedHash);
        if (isMatch) {
          verified = true;
          event.blockchainEventIndex = i;
          await event.save();
          break;
        }
      }
    }

    return res.json({
      verified,
      storedHash,
      chainHash: verified ? storedHash : null,
      txHash: event.blockchainTxHash,
      blockNumber: event.blockchainBlockNumber,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  getTxByHash,
  verifyEvent,
};
