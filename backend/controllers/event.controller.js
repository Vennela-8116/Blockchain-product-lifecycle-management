const mongoose = require("mongoose");
const LifecycleEvent = require("../models/LifecycleEvent");
const Product = require("../models/Product");
const ServiceCenter = require("../models/ServiceCenter");
const {
  recordLifecycleEventOnChain,
  verifyEventHashOnChain,
  computeEventHash,
} = require("../config/blockchain");

const VALID_EVENT_TYPES = [
  "REPAIR",
  "MAINTENANCE",
  "INSPECTION",
  "COMPONENT_REPLACEMENT",
  "WARRANTY_CLAIM",
  "OTHER",
];

/**
 * @desc    Record a new lifecycle event (service center only)
 * @route   POST /api/events
 * @access  Private (ServiceCenter)
 */
const recordEvent = async (req, res, next) => {
  try {
    const {
      productId,
      eventType,
      title,
      description,
      serviceDate,
      completionDate,
      technicianName,
      parts,
      laborCost,
      partsCost,
      currency,
      notes,
    } = req.body;

    // 1. Find product by productId
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 2. Find ServiceCenter by userId = req.user._id, check isAuthorized
    const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id });
    if (!serviceCenter) {
      return res.status(403).json({
        error: "No service center profile associated with this account",
      });
    }
    if (!serviceCenter.isAuthorized) {
      return res.status(403).json({
        error: "Service center is not authorized to submit lifecycle events",
      });
    }

    // 3. Validate eventType
    if (!eventType || !VALID_EVENT_TYPES.includes(eventType)) {
      return res.status(400).json({
        error: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(", ")}`,
      });
    }

    // 4 & 5. Build canonical JSON & save LifecycleEvent with blockchainStatus='pending'
    const eventDateStr = serviceDate ? new Date(serviceDate).toISOString() : new Date().toISOString();
    const canonicalPayload = {
      productId: product.productId,
      eventType,
      title: title ? title.trim() : "",
      description: description ? description.trim() : "",
      serviceDate: eventDateStr,
      submittedBy: req.user._id.toString(),
      timestamp: new Date().toISOString(),
    };
    const canonicalJson = JSON.stringify(canonicalPayload, null, 0);

    const event = new LifecycleEvent({
      productId: product.productId,
      eventType,
      title: title.trim(),
      description: description.trim(),
      serviceCenterId: serviceCenter._id,
      submittedBy: req.user._id,
      technicianName: technicianName || "",
      parts: parts || [],
      laborCost: laborCost || 0,
      partsCost: partsCost || 0,
      currency: currency || "USD",
      serviceDate: new Date(eventDateStr),
      completionDate: completionDate ? new Date(completionDate) : undefined,
      notes: notes || "",
      canonicalJson,
      blockchainStatus: "pending",
    });

    await event.save();

    // 6. Call recordLifecycleEventOnChain
    try {
      const chainResult = await recordLifecycleEventOnChain(
        product.productId,
        canonicalJson,
        eventType
      );

      // 7. On success: update event
      event.blockchainTxHash = chainResult.txHash;
      event.blockchainBlockNumber = chainResult.blockNumber;
      event.eventHash = chainResult.eventHash;
      event.blockchainStatus = "confirmed";
      event.canonicalJson = canonicalJson;
      await event.save();
    } catch (chainErr) {
      // 8. On failure: update event
      console.error("Blockchain recordLifecycleEvent failed:", chainErr.message || chainErr);
      event.blockchainStatus = "failed";
      event.blockchainError = chainErr.message || "Failed to record event on blockchain";
      event.retryCount = (event.retryCount || 0) + 1;
      await event.save();
    }

    // 9. Return the saved event
    return res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all lifecycle events for a product
 * @route   GET /api/events/:productId
 * @access  Private (Authenticated)
 */
const getProductEvents = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const events = await LifecycleEvent.find({ productId })
      .populate("serviceCenterId", "name address city country contactEmail")
      .populate("submittedBy", "name email")
      .sort({ serviceDate: -1 });

    return res.json(events);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single lifecycle event
 * @route   GET /api/events/event/:eventId
 * @access  Private (Authenticated)
 */
const getEventById = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const event = await LifecycleEvent.findById(eventId)
      .populate("serviceCenterId", "name address city country contactEmail")
      .populate("submittedBy", "name email");

    if (!event) {
      return res.status(404).json({ error: "Lifecycle event not found" });
    }

    return res.json(event);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify event hash on blockchain against canonical JSON in DB
 * @route   GET /api/events/event/:eventId/verify
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

    // Compute storedHash of canonicalJson
    const storedHash = computeEventHash(event.canonicalJson);

    // If event was never confirmed on-chain
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

    // Verify against on-chain hash
    let verified = false;
    if (event.blockchainEventIndex !== null && event.blockchainEventIndex !== undefined) {
      verified = await verifyEventHashOnChain(
        event.productId,
        event.blockchainEventIndex,
        storedHash
      );
    } else {
      // Check indices 0..20 to locate matching event on chain
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
  recordEvent,
  getProductEvents,
  getEventById,
  verifyEvent,
};
