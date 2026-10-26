/**
 * RepairChain Demo Seed Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates demo users, registers a laptop product on the local Hardhat blockchain,
 * records two lifecycle events, and completes one ownership transfer.
 *
 * Run AFTER:
 *   1. npx hardhat node (in blockchain/ directory, keep running)
 *   2. npm run deploy   (in blockchain/ directory)
 *   3. MongoDB running
 *
 * Usage:
 *   cd backend && node scripts/seed.js
 */

require("dotenv").config();
const mongoose  = require("mongoose");
const bcrypt    = require("bcryptjs");
const User           = require("../models/User");
const Product        = require("../models/Product");
const LifecycleEvent = require("../models/LifecycleEvent");
const OwnershipTransfer = require("../models/OwnershipTransfer");
const ServiceCenter  = require("../models/ServiceCenter");
const blockchain     = require("../config/blockchain");

// ─── Hardhat test account addresses (public — safe to commit) ─────────────────
const ADMIN_ADDRESS   = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Account #0
const SERVICE_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Account #1
const OWNER_ADDRESS   = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"; // Account #2
const BUYER_ADDRESS   = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"; // Account #3

async function seed() {
  console.log("\n🌱 RepairChain Demo Seed Starting...\n");

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/repairchain";
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");

  // ── Check blockchain availability ──────────────────────────────────────────
  const chainAvailable = await blockchain.isBlockchainAvailable();
  console.log(chainAvailable
    ? "✅ Blockchain node available"
    : "⚠️  Blockchain unavailable — events will be saved with blockchainStatus=failed"
  );

  // ── Clear existing demo data ──────────────────────────────────────────────
  const demoEmails = [
    "admin@repairchain.dev",
    "owner@repairchain.dev",
    "newowner@repairchain.dev",
    "tech@repairchain.dev",
  ];

  // Delete by wallet address directly to avoid orphan issues
  await ServiceCenter.deleteMany({ walletAddress: SERVICE_ADDRESS });
  await OwnershipTransfer.deleteMany({ productId: "RC-00001" });
  await LifecycleEvent.deleteMany({ productId: "RC-00001" });
  await Product.deleteMany({ serialNumber: "LAPTOP-DEMO-2024-001" });
  await User.deleteMany({ email: { $in: demoEmails } });


  console.log("🗑  Cleared old seed data\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. Create Users
  // ═══════════════════════════════════════════════════════════════════════════

  const adminUser = await User.create({
    name:          "RepairChain Admin",
    email:         "admin@repairchain.dev",
    password:      "Admin@123456",
    role:          "admin",
    walletAddress: ADMIN_ADDRESS,
  });
  console.log(`👤 Admin created:        ${adminUser.email}`);

  const ownerUser = await User.create({
    name:          "Alice Johnson",
    email:         "owner@repairchain.dev",
    password:      "Owner@123456",
    role:          "owner",
    walletAddress: OWNER_ADDRESS,
  });
  console.log(`👤 Owner created:        ${ownerUser.email}`);

  const newOwnerUser = await User.create({
    name:          "Bob Smith",
    email:         "newowner@repairchain.dev",
    password:      "Owner@123456",
    role:          "owner",
    walletAddress: BUYER_ADDRESS,
  });
  console.log(`👤 New owner created:    ${newOwnerUser.email}`);

  const techUser = await User.create({
    name:          "TechFix Solutions",
    email:         "tech@repairchain.dev",
    password:      "Tech@123456",
    role:          "serviceCenter",
    walletAddress: SERVICE_ADDRESS,
  });
  console.log(`👤 Technician created:   ${techUser.email}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. Create & Authorize Service Center
  // ═══════════════════════════════════════════════════════════════════════════

  const serviceCenter = await ServiceCenter.create({
    userId:        techUser._id,
    name:          "TechFix Solutions",
    address:       "42 Innovation Drive",
    city:          "San Francisco",
    country:       "US",
    contactEmail:  "tech@repairchain.dev",
    phone:         "+1-415-555-0100",
    walletAddress: SERVICE_ADDRESS,
    specializations: ["laptop", "phone", "tablet"],
    isAuthorized:  false,
  });
  console.log(`🏢 Service center record created: ${serviceCenter.name}\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. Register Laptop Product
  // ═══════════════════════════════════════════════════════════════════════════

  const productId = await Product.generateProductId();
  const product = new Product({
    productId,
    serialNumber:   "LAPTOP-DEMO-2024-001",
    name:           "ProBook X1 Carbon",
    brand:          "ThinkStation",
    model:          "X1 Carbon Gen 12",
    category:       "laptop",
    description:    "High-performance business laptop — 14\" 2.8K OLED, Intel Core Ultra 7, 32GB RAM, 1TB NVMe SSD",
    purchaseDate:   new Date("2024-03-15"),
    warrantyExpiry: new Date("2027-03-15"),
    currentOwner:    ownerUser._id,
    registeredBy:    adminUser._id,
    ownerWalletAddress: ADMIN_ADDRESS,
    blockchainStatus: "pending",
  });

  await product.save();
  console.log(`💻 Product created: ${productId} — ${product.name}`);

  if (chainAvailable) {
    try {
      const res = await blockchain.registerProductOnChain(
        productId,
        product.serialNumber,
        ADMIN_ADDRESS
      );
      product.blockchainTxHash     = res.txHash;
      product.blockchainBlockNumber = res.blockNumber;
      product.blockchainStatus     = "confirmed";
      await product.save();
      console.log(`⛓  Product registered on-chain: ${res.txHash}`);
    } catch (e) {
      console.warn("⚠️  Product on-chain registration failed:", e.message);
      product.blockchainStatus = "failed";
      await product.save();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2b. Authorize Service Center (AFTER product registration to avoid nonce collision)
  // ═══════════════════════════════════════════════════════════════════════════

  let authTxHash = null;
  if (chainAvailable) {
    try {
      const res = await blockchain.authorizeServiceCenterOnChain(SERVICE_ADDRESS);
      authTxHash = res.txHash;
      serviceCenter.authTxHash      = authTxHash;
      serviceCenter.authBlockNumber  = res.blockNumber;
      console.log(`⛓  SC authorized on-chain: ${authTxHash}`);
    } catch (e) {
      console.warn("⚠️  SC on-chain authorization failed:", e.message);
    }
  }
  serviceCenter.isAuthorized  = true;
  serviceCenter.authorizedAt  = new Date();
  await serviceCenter.save();
  console.log(`✅ Service center authorized: ${serviceCenter.name}\n`);


  // ═══════════════════════════════════════════════════════════════════════════
  // 4. Record Lifecycle Events
  // ═══════════════════════════════════════════════════════════════════════════

  const eventsData = [
    {
      eventType:    "INSPECTION",
      title:        "Initial Quality Inspection",
      description:  "Comprehensive pre-delivery inspection: hardware diagnostics passed, BIOS updated to v1.42, battery capacity 100%, all ports functional.",
      serviceDate:  new Date("2024-03-15"),
      technicianName: "Marco Torres",
      parts:        [],
      laborCost:    0,
      partsCost:    0,
    },
    {
      eventType:    "REPAIR",
      title:        "Screen Replacement",
      description:  "Replaced damaged OLED display panel after user reported dead pixels in upper-left quadrant. Performed full display calibration post-replacement.",
      serviceDate:  new Date("2024-08-22"),
      technicianName: "Sarah Chen",
      parts: [
        { name: "14\" OLED Display Panel", partNumber: "PN-OLED-X1G12-01", manufacturer: "LG Display", condition: "new" },
        { name: "Display Adhesive Kit",    partNumber: "ADH-14-KIT",        manufacturer: "Generic",    condition: "new" },
      ],
      laborCost: 120,
      partsCost: 380,
    },
  ];

  for (const ed of eventsData) {
    const canonicalPayload = {
      productId:   product.productId,
      eventType:   ed.eventType,
      title:       ed.title,
      description: ed.description,
      serviceDate: ed.serviceDate.toISOString(),
      submittedBy: techUser._id.toString(),
      timestamp:   new Date().toISOString(),
    };
    const canonicalJson = JSON.stringify(canonicalPayload, null, 0);

    const event = new LifecycleEvent({
      productId:     product.productId,
      eventType:     ed.eventType,
      title:         ed.title,
      description:   ed.description,
      submittedBy:   techUser._id,
      serviceCenterId: serviceCenter._id,
      serviceDate:   ed.serviceDate,
      technicianName: ed.technicianName,
      parts:         ed.parts,
      laborCost:     ed.laborCost,
      partsCost:     ed.partsCost,
      currency:      "USD",
      canonicalJson,
      blockchainStatus: "pending",
    });

    await event.save();

    if (chainAvailable) {
      try {
        const res = await blockchain.recordLifecycleEventOnChain(
          product.productId,
          canonicalJson,
          ed.eventType
        );
        event.blockchainTxHash     = res.txHash;
        event.blockchainBlockNumber = res.blockNumber;
        event.eventHash            = res.eventHash;
        event.blockchainStatus     = "confirmed";
        await event.save();
        console.log(`⛓  Event [${ed.eventType}] on-chain: ${res.txHash}`);
      } catch (e) {
        console.warn(`⚠️  Event [${ed.eventType}] on-chain failed:`, e.message);
        event.blockchainStatus = "failed";
        await event.save();
      }
    }
    console.log(`📝 Event recorded: ${ed.title}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. Ownership Transfer
  // ═══════════════════════════════════════════════════════════════════════════

  console.log("\n🔄 Initiating ownership transfer...");

  const transfer = new OwnershipTransfer({
    productId:   product.productId,
    fromOwner:   ownerUser._id,
    toOwner:     newOwnerUser._id,
    toEmail:     newOwnerUser.email,
    status:      "pending",
    initiatedAt: new Date("2024-09-01"),
    initBlockchainStatus: "not_submitted",
  });
  await transfer.save();

  if (chainAvailable) {
    try {
      // Initiate: admin (current on-chain owner proxy) transfers to BUYER_ADDRESS (Account #3)
      const res = await blockchain.initiateTransferOnChain(product.productId, BUYER_ADDRESS);
      transfer.initTxHash           = res.txHash;
      transfer.initBlockNumber      = res.blockNumber;
      transfer.initBlockchainStatus = "confirmed";
      await transfer.save();
      console.log(`⛓  Transfer initiated on-chain: ${res.txHash}`);

      // Accept: service signer (Account #1) is set as pending owner... but our contract
      // sets BUYER_ADDRESS (Account #3) as pending owner. We can't sign as Account #3
      // in this backend-signed model without Account #3's private key.
      // So we accept in DB only and mark blockchain status as not_submitted.
      transfer.status                 = "accepted";
      transfer.acceptedAt             = new Date("2024-09-02");
      transfer.acceptBlockchainStatus = "not_submitted";
      await transfer.save();
      product.currentOwner = newOwnerUser._id;
      await product.save();
    } catch (e) {
      console.warn("⚠️  Transfer on-chain failed:", e.message.split("\n")[0]);
      // Fall back to DB-only transfer record
      transfer.initBlockchainStatus = "failed";
      transfer.status               = "accepted";
      transfer.acceptedAt           = new Date("2024-09-02");
      await transfer.save();
      product.currentOwner = newOwnerUser._id;
      await product.save();
    }
  } else {
    transfer.status     = "accepted";
    transfer.acceptedAt = new Date("2024-09-02");
    await transfer.save();
    product.currentOwner = newOwnerUser._id;
    await product.save();
  }


  console.log(`✅ Ownership transferred: ${ownerUser.name} → ${newOwnerUser.name}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n" + "═".repeat(60));
  console.log("🎉 SEED COMPLETE — Demo credentials:");
  console.log("═".repeat(60));
  console.log(`  Admin:        admin@repairchain.dev     / Admin@123456`);
  console.log(`  Owner:        owner@repairchain.dev     / Owner@123456`);
  console.log(`  New Owner:    newowner@repairchain.dev  / Owner@123456`);
  console.log(`  ServiceCenter:tech@repairchain.dev      / Tech@123456`);
  console.log(`\n  Product ID:   ${productId}`);
  console.log(`  Serial #:     LAPTOP-DEMO-2024-001`);
  console.log(`\n  Verify at:    http://localhost:5173/passport/${productId}`);
  console.log("═".repeat(60) + "\n");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
