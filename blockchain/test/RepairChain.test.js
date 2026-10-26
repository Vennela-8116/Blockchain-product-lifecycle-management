const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RepairChain", function () {
  let repairChain;
  let admin, serviceCenter, user1, user2, unauthorized;

  const PRODUCT_ID_1 = "RC-00001";
  const SERIAL_1     = "SN-LAPTOP-001";
  const PRODUCT_ID_2 = "RC-00002";
  const SERIAL_2     = "SN-LAPTOP-002";

  beforeEach(async function () {
    [admin, serviceCenter, user1, user2, unauthorized] = await ethers.getSigners();

    const RepairChain = await ethers.getContractFactory("RepairChain");
    repairChain = await RepairChain.deploy();
    await repairChain.waitForDeployment();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Deployment
  // ─────────────────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await repairChain.admin()).to.equal(admin.address);
    });

    it("Should start with zero products", async function () {
      expect(await repairChain.getProductCount()).to.equal(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Product Registration
  // ─────────────────────────────────────────────────────────────────────────
  describe("Product Registration", function () {
    it("Admin can register a product", async function () {
      await expect(
        repairChain.registerProduct(PRODUCT_ID_1, SERIAL_1, user1.address)
      ).to.emit(repairChain, "ProductRegistered");

      expect(await repairChain.getProductCount()).to.equal(1);
    });

    it("Should store product details correctly", async function () {
      await repairChain.registerProduct(PRODUCT_ID_1, SERIAL_1, user1.address);
      const product = await repairChain.getProduct(PRODUCT_ID_1);
      expect(product.pid).to.equal(PRODUCT_ID_1);
      expect(product.serialNumber).to.equal(SERIAL_1);
      expect(product.owner).to.equal(user1.address);
      expect(product.transferPending).to.be.false;
      expect(product.eventCount).to.equal(0);
    });

    it("Should prevent duplicate product IDs", async function () {
      await repairChain.registerProduct(PRODUCT_ID_1, SERIAL_1, user1.address);
      await expect(
        repairChain.registerProduct(PRODUCT_ID_1, SERIAL_2, user2.address)
      ).to.be.revertedWith("RepairChain: productId already registered");
    });

    it("Should prevent duplicate serial numbers", async function () {
      await repairChain.registerProduct(PRODUCT_ID_1, SERIAL_1, user1.address);
      await expect(
        repairChain.registerProduct(PRODUCT_ID_2, SERIAL_1, user2.address)
      ).to.be.revertedWith("RepairChain: serialNumber already registered");
    });

    it("Should revert if called by non-admin", async function () {
      await expect(
        repairChain.connect(unauthorized).registerProduct(PRODUCT_ID_1, SERIAL_1, user1.address)
      ).to.be.revertedWith("RepairChain: caller is not admin");
    });

    it("Should revert with empty productId", async function () {
      await expect(
        repairChain.registerProduct("", SERIAL_1, user1.address)
      ).to.be.revertedWith("RepairChain: empty productId");
    });

    it("Should look up product by serial number", async function () {
      await repairChain.registerProduct(PRODUCT_ID_1, SERIAL_1, user1.address);
      const pid = await repairChain.getProductIdBySerial(SERIAL_1);
      expect(pid).to.equal(PRODUCT_ID_1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Service Center Authorization
  // ─────────────────────────────────────────────────────────────────────────
  describe("Service Center Management", function () {
    it("Admin can authorize a service center", async function () {
      await expect(repairChain.addAuthorizedServiceCenter(serviceCenter.address))
        .to.emit(repairChain, "ServiceCenterAuthorized");
      expect(await repairChain.authorizedServiceCenters(serviceCenter.address)).to.be.true;
    });

    it("Admin can deactivate a service center", async function () {
      await repairChain.addAuthorizedServiceCenter(serviceCenter.address);
      await expect(repairChain.removeAuthorizedServiceCenter(serviceCenter.address))
        .to.emit(repairChain, "ServiceCenterDeactivated");
      expect(await repairChain.authorizedServiceCenters(serviceCenter.address)).to.be.false;
    });

    it("Non-admin cannot authorize a service center", async function () {
      await expect(
        repairChain.connect(unauthorized).addAuthorizedServiceCenter(serviceCenter.address)
      ).to.be.revertedWith("RepairChain: caller is not admin");
    });

    it("Cannot authorize an already-authorized service center", async function () {
      await repairChain.addAuthorizedServiceCenter(serviceCenter.address);
      await expect(
        repairChain.addAuthorizedServiceCenter(serviceCenter.address)
      ).to.be.revertedWith("RepairChain: already authorized");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle Events
  // ─────────────────────────────────────────────────────────────────────────
  describe("Lifecycle Events", function () {
    const eventHash = ethers.keccak256(ethers.toUtf8Bytes("test-event-data-001"));

    beforeEach(async function () {
      await repairChain.registerProduct(PRODUCT_ID_1, SERIAL_1, user1.address);
      await repairChain.addAuthorizedServiceCenter(serviceCenter.address);
    });

    it("Authorized service center can record a lifecycle event", async function () {
      await expect(
        repairChain.connect(serviceCenter).recordLifecycleEvent(
          PRODUCT_ID_1, eventHash, "REPAIR"
        )
      ).to.emit(repairChain, "LifecycleEventRecorded");

      const count = await repairChain.getLifecycleEventCount(PRODUCT_ID_1);
      expect(count).to.equal(1);
    });

    it("Should store lifecycle event data correctly", async function () {
      await repairChain.connect(serviceCenter).recordLifecycleEvent(
        PRODUCT_ID_1, eventHash, "INSPECTION"
      );
      const ev = await repairChain.getLifecycleEvent(PRODUCT_ID_1, 0);
      expect(ev.eventHash).to.equal(eventHash);
      expect(ev.submitter).to.equal(serviceCenter.address);
      expect(ev.eventType).to.equal("INSPECTION");
    });

    it("Unauthorized address cannot record a lifecycle event", async function () {
      await expect(
        repairChain.connect(unauthorized).recordLifecycleEvent(
          PRODUCT_ID_1, eventHash, "REPAIR"
        )
      ).to.be.revertedWith("RepairChain: caller is not an authorized service center");
    });

    it("Cannot record event for non-existent product", async function () {
      await expect(
        repairChain.connect(serviceCenter).recordLifecycleEvent(
          "RC-NONEXISTENT", eventHash, "REPAIR"
        )
      ).to.be.revertedWith("RepairChain: product does not exist");
    });

    it("verifyEventHash returns true for matching hash", async function () {
      await repairChain.connect(serviceCenter).recordLifecycleEvent(
        PRODUCT_ID_1, eventHash, "REPAIR"
      );
      expect(await repairChain.verifyEventHash(PRODUCT_ID_1, 0, eventHash)).to.be.true;
    });

    it("verifyEventHash returns false for wrong hash", async function () {
      await repairChain.connect(serviceCenter).recordLifecycleEvent(
        PRODUCT_ID_1, eventHash, "REPAIR"
      );
      const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong-data"));
      expect(await repairChain.verifyEventHash(PRODUCT_ID_1, 0, wrongHash)).to.be.false;
    });

    it("Deactivated service center cannot record events", async function () {
      await repairChain.removeAuthorizedServiceCenter(serviceCenter.address);
      await expect(
        repairChain.connect(serviceCenter).recordLifecycleEvent(
          PRODUCT_ID_1, eventHash, "REPAIR"
        )
      ).to.be.revertedWith("RepairChain: caller is not an authorized service center");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Ownership Transfer
  // ─────────────────────────────────────────────────────────────────────────
  describe("Ownership Transfer", function () {
    beforeEach(async function () {
      await repairChain.registerProduct(PRODUCT_ID_1, SERIAL_1, user1.address);
    });

    it("Owner can initiate a transfer", async function () {
      await expect(
        repairChain.connect(user1).initiateOwnershipTransfer(PRODUCT_ID_1, user2.address)
      ).to.emit(repairChain, "OwnershipTransferInitiated");

      const product = await repairChain.getProduct(PRODUCT_ID_1);
      expect(product.transferPending).to.be.true;
      expect(product.pendingNewOwner).to.equal(user2.address);
    });

    it("New owner can accept the transfer", async function () {
      await repairChain.connect(user1).initiateOwnershipTransfer(PRODUCT_ID_1, user2.address);
      await expect(
        repairChain.connect(user2).acceptOwnershipTransfer(PRODUCT_ID_1)
      ).to.emit(repairChain, "OwnershipTransferAccepted");

      const product = await repairChain.getProduct(PRODUCT_ID_1);
      expect(product.owner).to.equal(user2.address);
      expect(product.transferPending).to.be.false;
    });

    it("Non-owner cannot initiate a transfer", async function () {
      await expect(
        repairChain.connect(unauthorized).initiateOwnershipTransfer(PRODUCT_ID_1, user2.address)
      ).to.be.revertedWith("RepairChain: caller is not the product owner");
    });

    it("Wrong address cannot accept a transfer", async function () {
      await repairChain.connect(user1).initiateOwnershipTransfer(PRODUCT_ID_1, user2.address);
      await expect(
        repairChain.connect(unauthorized).acceptOwnershipTransfer(PRODUCT_ID_1)
      ).to.be.revertedWith("RepairChain: caller is not the pending owner");
    });

    it("Cannot initiate transfer when one is pending", async function () {
      await repairChain.connect(user1).initiateOwnershipTransfer(PRODUCT_ID_1, user2.address);
      await expect(
        repairChain.connect(user1).initiateOwnershipTransfer(PRODUCT_ID_1, user2.address)
      ).to.be.revertedWith("RepairChain: transfer already pending");
    });

    it("Owner can cancel a pending transfer", async function () {
      await repairChain.connect(user1).initiateOwnershipTransfer(PRODUCT_ID_1, user2.address);
      await expect(
        repairChain.connect(user1).cancelOwnershipTransfer(PRODUCT_ID_1)
      ).to.emit(repairChain, "OwnershipTransferCancelled");
      const product = await repairChain.getProduct(PRODUCT_ID_1);
      expect(product.transferPending).to.be.false;
    });

    it("Cannot transfer to self", async function () {
      await expect(
        repairChain.connect(user1).initiateOwnershipTransfer(PRODUCT_ID_1, user1.address)
      ).to.be.revertedWith("RepairChain: cannot transfer to self");
    });
  });
});
