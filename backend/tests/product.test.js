const mongoose = require("mongoose");
const request = require("supertest");

// Mock the blockchain module
jest.mock("../config/blockchain", () => ({
  registerProductOnChain: jest.fn().mockResolvedValue({
    txHash: "0x123",
    blockNumber: 1,
  }),
  authorizeServiceCenterOnChain: jest.fn().mockResolvedValue({
    txHash: "0xauth123",
    blockNumber: 1,
  }),
  deactivateServiceCenterOnChain: jest.fn().mockResolvedValue({
    txHash: "0xdeact123",
    blockNumber: 2,
  }),
  recordLifecycleEventOnChain: jest.fn().mockResolvedValue({
    txHash: "0xevent123",
    blockNumber: 3,
    eventHash: "0xhash123",
  }),
  initiateTransferOnChain: jest.fn().mockResolvedValue({
    txHash: "0xinit123",
    blockNumber: 4,
  }),
  acceptTransferOnChain: jest.fn().mockResolvedValue({
    txHash: "0xaccept123",
    blockNumber: 5,
  }),
  verifyEventHashOnChain: jest.fn().mockResolvedValue(true),
  computeEventHash: jest.fn().mockReturnValue("0xhash123"),
  isBlockchainAvailable: jest.fn().mockResolvedValue(true),
  getCurrentBlock: jest.fn().mockResolvedValue(100),
  getTxReceipt: jest.fn().mockResolvedValue({ status: 1 }),
}));

const app = require("../server");
const Product = require("../models/Product");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_123456789";

const TEST_DB_URI =
  process.env.MONGODB_URI_TEST ||
  "mongodb://localhost:27017/repairchain_test";

describe("Product Controller Tests (/api/products)", () => {
  let mongoConnected = false;
  let adminUser = null;
  let ownerUser = null;
  let adminToken = null;
  let ownerToken = null;
  let createdProductId = null;

  beforeAll(async () => {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      }
      mongoConnected = true;

      // Clean test products and users
      await Product.deleteMany({ serialNumber: { $regex: /^SN-PRODTEST-/ } });
      await User.deleteMany({ email: { $regex: /@prodtest\.com$/i } });

      // Create admin and owner users
      adminUser = await User.create({
        name: "Admin Product Tester",
        email: "admin@prodtest.com",
        password: "Password123!",
        role: "admin",
      });

      ownerUser = await User.create({
        name: "Owner Product Tester",
        email: "owner@prodtest.com",
        password: "Password123!",
        role: "owner",
      });

      adminToken = generateToken({
        id: adminUser._id.toString(),
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      });

      ownerToken = generateToken({
        id: ownerUser._id.toString(),
        name: ownerUser.name,
        email: ownerUser.email,
        role: ownerUser.role,
      });
    } catch (err) {
      console.warn("⚠️ Test MongoDB not connected. Tests requiring active DB will be skipped.", err.message);
    }
  });

  afterAll(async () => {
    if (mongoConnected) {
      try {
        await Product.deleteMany({ serialNumber: { $regex: /^SN-PRODTEST-/ } });
        await User.deleteMany({ email: { $regex: /@prodtest\.com$/i } });
        await mongoose.connection.close();
      } catch (err) {
        console.warn("⚠️ Teardown error:", err.message);
      }
    }
  });

  // ── POST /api/products ─────────────────────────────────────────────────────
  describe("POST /api/products", () => {
    const productPayload = {
      serialNumber: "SN-PRODTEST-001",
      name: "ThinkPad X1 Carbon",
      brand: "Lenovo",
      model: "Gen 11",
      category: "laptop",
      description: "High performance ultrabook",
    };

    it("should allow an admin to create a product and register it on chain", async () => {
      if (!mongoConnected) return;

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(productPayload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("productId");
      expect(res.body.productId).toMatch(/^RC-/);
      expect(res.body.serialNumber).toBe(productPayload.serialNumber);
      expect(res.body.blockchainStatus).toBe("confirmed");
      expect(res.body.blockchainTxHash).toBe("0x123");
      expect(res.body.blockchainBlockNumber).toBe(1);

      createdProductId = res.body.productId;
    });

    it("should reject non-admin from creating a product", async () => {
      if (!mongoConnected) return;

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          ...productPayload,
          serialNumber: "SN-PRODTEST-002",
        });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/Access denied/i);
    });

    it("should reject duplicate serial number registration", async () => {
      if (!mongoConnected) return;

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(productPayload);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/already exists/i);
    });
  });

  // ── GET /api/products/verify/:productId ────────────────────────────────────
  describe("GET /api/products/verify/:productId", () => {
    it("should allow public access and return safe product data without private email", async () => {
      if (!mongoConnected || !createdProductId) return;

      const res = await request(app).get(`/api/products/verify/${createdProductId}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("product");
      expect(res.body).toHaveProperty("events");
      expect(res.body).toHaveProperty("transfers");

      const { product } = res.body;
      expect(product.productId).toBe(createdProductId);
      expect(product.name).toBe("ThinkPad X1 Carbon");

      // Verify owner privacy: name only, no email exposed
      if (product.currentOwner) {
        expect(product.currentOwner).toHaveProperty("name");
        expect(product.currentOwner).not.toHaveProperty("email");
      }
      expect(product).not.toHaveProperty("registeredBy");
    });
  });

  // ── GET /api/products/:productId ───────────────────────────────────────────
  describe("GET /api/products/:productId", () => {
    it("should reject unauthenticated request", async () => {
      if (!createdProductId) return;

      const res = await request(app).get(`/api/products/${createdProductId}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });

    it("should return product details when authenticated", async () => {
      if (!mongoConnected || !createdProductId) return;

      const res = await request(app)
        .get(`/api/products/${createdProductId}`)
        .set("Authorization", `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.productId).toBe(createdProductId);
      expect(res.body).toHaveProperty("currentOwner");
      expect(res.body.currentOwner).toHaveProperty("name");
      expect(res.body.currentOwner).toHaveProperty("email");
    });
  });
});
