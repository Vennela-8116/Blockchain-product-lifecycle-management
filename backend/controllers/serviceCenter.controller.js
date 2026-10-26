const mongoose = require("mongoose");
const ServiceCenter = require("../models/ServiceCenter");
const User = require("../models/User");
const {
  authorizeServiceCenterOnChain,
  deactivateServiceCenterOnChain,
} = require("../config/blockchain");

/**
 * @desc    List all service centers (admin only)
 * @route   GET /api/service-centers
 * @access  Private (Admin)
 */
const getAllServiceCenters = async (_req, res, next) => {
  try {
    const serviceCenters = await ServiceCenter.find()
      .populate("userId", "name email role walletAddress")
      .sort({ createdAt: -1 });

    return res.json(serviceCenters);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new service center linked to existing user
 * @route   POST /api/service-centers
 * @access  Private (Admin)
 */
const createServiceCenter = async (req, res, next) => {
  try {
    const {
      userId,
      name,
      address,
      city,
      country,
      contactEmail,
      phone,
      specializations,
      walletAddress,
    } = req.body;

    if (!userId || !name || !walletAddress) {
      return res.status(400).json({
        error: "userId, name, and walletAddress are required",
      });
    }

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Invalid userId format" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if profile already exists for user
    const existingByUser = await ServiceCenter.findOne({ userId });
    if (existingByUser) {
      return res.status(400).json({
        error: "A service center profile already exists for this user",
      });
    }

    // Check unique wallet address
    const normalizedWallet = walletAddress.toLowerCase().trim();
    const existingByWallet = await ServiceCenter.findOne({
      walletAddress: normalizedWallet,
    });
    if (existingByWallet) {
      return res.status(400).json({
        error: "A service center is already registered with this wallet address",
      });
    }

    // Ensure user has role and wallet set
    user.role = "serviceCenter";
    user.walletAddress = normalizedWallet;
    await user.save();

    const serviceCenter = new ServiceCenter({
      userId: user._id,
      name: name.trim(),
      address: address ? address.trim() : "",
      city: city ? city.trim() : "",
      country: country ? country.trim() : "US",
      contactEmail: contactEmail ? contactEmail.toLowerCase().trim() : user.email,
      phone: phone ? phone.trim() : "",
      specializations: specializations || [],
      walletAddress: normalizedWallet,
      isAuthorized: false,
    });

    await serviceCenter.save();

    const populated = await ServiceCenter.findById(serviceCenter._id)
      .populate("userId", "name email role walletAddress");

    return res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single service center by ID
 * @route   GET /api/service-centers/:id
 * @access  Private (Admin, ServiceCenter)
 */
const getServiceCenterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid service center ID" });
    }

    const serviceCenter = await ServiceCenter.findById(id)
      .populate("userId", "name email role walletAddress");

    if (!serviceCenter) {
      return res.status(404).json({ error: "Service center not found" });
    }

    return res.json(serviceCenter);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authorize a service center on-chain (admin only)
 * @route   PUT /api/service-centers/:id/authorize
 * @access  Private (Admin)
 */
const authorizeServiceCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid service center ID" });
    }

    // 1. Find service center
    const serviceCenter = await ServiceCenter.findById(id);
    if (!serviceCenter) {
      return res.status(404).json({ error: "Service center not found" });
    }

    // 2. Call authorizeServiceCenterOnChain
    try {
      const chainResult = await authorizeServiceCenterOnChain(serviceCenter.walletAddress);

      // 3. Update isAuthorized=true, authorizedAt=now, authTxHash, authBlockNumber
      serviceCenter.isAuthorized = true;
      serviceCenter.authorizedAt = new Date();
      serviceCenter.authTxHash = chainResult.txHash;
      serviceCenter.authBlockNumber = chainResult.blockNumber;
      await serviceCenter.save();

      // 4. Return updated service center
      return res.json(serviceCenter);
    } catch (chainErr) {
      console.error("Blockchain authorizeServiceCenter failed:", chainErr.message || chainErr);
      return res.status(500).json({
        error: "Failed to authorize service center on-chain",
        detail: chainErr.message,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate a service center on-chain (admin only)
 * @route   PUT /api/service-centers/:id/deactivate
 * @access  Private (Admin)
 */
const deactivateServiceCenter = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid service center ID" });
    }

    // 1. Find service center
    const serviceCenter = await ServiceCenter.findById(id);
    if (!serviceCenter) {
      return res.status(404).json({ error: "Service center not found" });
    }

    // 2. Call deactivateServiceCenterOnChain
    try {
      await deactivateServiceCenterOnChain(serviceCenter.walletAddress);

      // 3. Update isAuthorized=false, deactivatedAt=now
      serviceCenter.isAuthorized = false;
      serviceCenter.deactivatedAt = new Date();
      await serviceCenter.save();

      // 4. Return updated service center
      return res.json(serviceCenter);
    } catch (chainErr) {
      console.error("Blockchain deactivateServiceCenter failed:", chainErr.message || chainErr);
      return res.status(500).json({
        error: "Failed to deactivate service center on-chain",
        detail: chainErr.message,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the current user's service center profile
 * @route   GET /api/service-centers/my
 * @access  Private (ServiceCenter)
 */
const getMyServiceCenter = async (req, res, next) => {
  try {
    const serviceCenter = await ServiceCenter.findOne({ userId: req.user._id })
      .populate("userId", "name email role walletAddress");

    if (!serviceCenter) {
      return res.status(404).json({
        error: "No service center profile found for this user",
      });
    }

    return res.json(serviceCenter);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllServiceCenters,
  createServiceCenter,
  getServiceCenterById,
  authorizeServiceCenter,
  deactivateServiceCenter,
  getMyServiceCenter,
};
