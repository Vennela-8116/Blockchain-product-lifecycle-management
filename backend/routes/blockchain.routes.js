const express = require("express");
const blockchainController = require("../controllers/blockchain.controller");
const { protect, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /status — protect, requireRole('admin')
router.get("/status", protect, requireRole("admin"), blockchainController.getStatus);

// GET /tx/:hash — protect, requireRole('admin')
router.get("/tx/:hash", protect, requireRole("admin"), blockchainController.getTxByHash);

// GET /verify-event/:eventId — public
router.get("/verify-event/:eventId", blockchainController.verifyEvent);

module.exports = router;
