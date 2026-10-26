const mongoose = require("mongoose");
const { ethers } = require("ethers");
const Product = require("../models/Product");
const LifecycleEvent = require("../models/LifecycleEvent");
const OwnershipTransfer = require("../models/OwnershipTransfer");
const User = require("../models/User");
const { registerProductOnChain } = require("../config/blockchain");

/**
 * @desc    Get all products (admin only)
 * @route   GET /api/products
 * @access  Private (Admin)
 */
const getAllProducts = async (_req, res, next) => {
  try {
    const products = await Product.find()
      .populate("currentOwner", "name email walletAddress")
      .populate("registeredBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(products);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create/register a new product
 * @route   POST /api/products
 * @access  Private (Admin)
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      serialNumber,
      name,
      brand,
      model,
      category,
      description,
      purchaseDate,
      warrantyExpiry,
      currentOwner,
      ownerWalletAddress,
      status,
    } = req.body;

    // Check duplicate serial number
    const existing = await Product.findOne({ serialNumber: serialNumber.trim() });
    if (existing) {
      return res.status(400).json({ error: "Product with this serial number already exists" });
    }

    // Determine currentOwner (ObjectId)
    let ownerUser = null;
    if (currentOwner) {
      if (mongoose.isValidObjectId(currentOwner)) {
        ownerUser = await User.findById(currentOwner);
      } else if (typeof currentOwner === "string" && currentOwner.includes("@")) {
        ownerUser = await User.findOne({ email: currentOwner.toLowerCase().trim() });
      }
      if (!ownerUser) {
        return res.status(400).json({ error: "Specified currentOwner user not found" });
      }
    } else {
      // Default owner to registering admin
      ownerUser = req.user;
    }

    // Auto-generate next productId: RC-00001, etc.
    const productId = await Product.generateProductId();

    // Determine target wallet address for blockchain registration
    const walletToRegister =
      ownerWalletAddress ||
      (ownerUser && ownerUser.walletAddress) ||
      ethers.ZeroAddress;

    // Save product in DB with pending status
    const product = new Product({
      productId,
      serialNumber: serialNumber.trim(),
      name: name.trim(),
      brand: brand.trim(),
      model: model.trim(),
      category: category || "other",
      description: description ? description.trim() : "",
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
      currentOwner: ownerUser._id,
      registeredBy: req.user._id,
      ownerWalletAddress: ownerWalletAddress || (ownerUser ? ownerUser.walletAddress : null),
      status: status || "active",
      blockchainStatus: "pending",
    });

    await product.save();

    // Register on blockchain
    try {
      const chainResult = await registerProductOnChain(
        productId,
        product.serialNumber,
        walletToRegister
      );
      product.blockchainTxHash = chainResult.txHash;
      product.blockchainBlockNumber = chainResult.blockNumber;
      product.blockchainStatus = "confirmed";
      await product.save();
    } catch (blockchainErr) {
      console.error("Blockchain registration error for product", productId, ":", blockchainErr.message || blockchainErr);
      product.blockchainStatus = "failed";
      await product.save();
    }

    const populatedProduct = await Product.findById(product._id)
      .populate("currentOwner", "name email walletAddress")
      .populate("registeredBy", "name email");

    return res.status(201).json(populatedProduct);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product details
 * @route   GET /api/products/:productId
 * @access  Private (Authenticated)
 */
const getProductById = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const filter = mongoose.isValidObjectId(productId)
      ? { $or: [{ productId }, { _id: productId }] }
      : { productId };

    const product = await Product.findOne(filter)
      .populate("currentOwner", "name email walletAddress")
      .populate("registeredBy", "name email");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search products by productId or serialNumber
 * @route   GET /api/products/search?q=...
 * @access  Private (Admin, ServiceCenter)
 */
const searchProducts = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    const filter = q
      ? {
          $or: [
            { productId: { $regex: q, $options: "i" } },
            { serialNumber: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const products = await Product.find(filter)
      .populate("currentOwner", "name email")
      .sort({ createdAt: -1 });

    return res.json(products);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify product passport without private owner data
 * @route   GET /api/products/verify/:productId
 * @access  Public
 */
const verifyProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const filter = mongoose.isValidObjectId(productId)
      ? { $or: [{ productId }, { _id: productId }] }
      : { productId };

    const product = await Product.findOne(filter).lean();
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Owner public info only (name, no email)
    const owner = await User.findById(product.currentOwner).select("name walletAddress").lean();

    // Fetch all lifecycle events for this product
    const events = await LifecycleEvent.find({ productId: product.productId })
      .populate("serviceCenterId", "name city country")
      .populate("submittedBy", "name")
      .sort({ serviceDate: -1 })
      .lean();

    // Fetch transfer history (without private email fields)
    const transfers = await OwnershipTransfer.find({ productId: product.productId })
      .populate("fromOwner", "name")
      .populate("toOwner", "name")
      .select("-toEmail")
      .sort({ createdAt: -1 })
      .lean();

    const safeProduct = {
      _id: product._id,
      productId: product.productId,
      serialNumber: product.serialNumber,
      name: product.name,
      brand: product.brand,
      model: product.model,
      category: product.category,
      description: product.description,
      purchaseDate: product.purchaseDate,
      warrantyExpiry: product.warrantyExpiry,
      currentOwner: owner ? { name: owner.name, walletAddress: owner.walletAddress } : null,
      ownerWalletAddress: product.ownerWalletAddress,
      blockchainTxHash: product.blockchainTxHash,
      blockchainBlockNumber: product.blockchainBlockNumber,
      blockchainStatus: product.blockchainStatus,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return res.json({
      product: safeProduct,
      events,
      transfers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product status (e.g. active, inactive, recalled)
 * @route   PUT /api/products/:productId/status
 * @access  Private (Admin)
 */
const updateProductStatus = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "inactive", "recalled"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const filter = mongoose.isValidObjectId(productId)
      ? { $or: [{ productId }, { _id: productId }] }
      : { productId };

    const product = await Product.findOneAndUpdate(
      filter,
      { status },
      { new: true, runValidators: true }
    ).populate("currentOwner", "name email");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get products owned by the current user
 * @route   GET /api/products/owner/my
 * @access  Private (Owner, Admin)
 */
const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ currentOwner: req.user._id })
      .populate("currentOwner", "name email")
      .populate("registeredBy", "name email")
      .sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  getProductById,
  searchProducts,
  verifyProduct,
  updateProductStatus,
  getMyProducts,
};
