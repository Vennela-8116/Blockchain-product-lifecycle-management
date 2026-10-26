const express = require("express");
const { body } = require("express-validator");
const transferController = require("../controllers/transfer.controller");
const { protect, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// GET /my — protect, requireRole('owner')
router.get("/my", protect, requireRole("owner"), transferController.getMyTransfers);

// POST /initiate — protect, requireRole('owner'), validators
router.post(
  "/initiate",
  protect,
  requireRole("owner"),
  [
    body("productId").trim().notEmpty().withMessage("productId is required"),
    body("toEmail").isEmail().normalizeEmail().withMessage("Valid recipient email is required"),
    validate,
  ],
  transferController.initiateTransfer
);

// POST /:transferId/accept — protect, requireRole('owner')
router.post(
  "/:transferId/accept",
  protect,
  requireRole("owner"),
  transferController.acceptTransfer
);

// POST /:transferId/cancel — protect, requireRole('owner')
router.post(
  "/:transferId/cancel",
  protect,
  requireRole("owner"),
  transferController.cancelTransfer
);

// GET /product/:productId — protect
router.get("/product/:productId", protect, transferController.getProductTransfers);

module.exports = router;
