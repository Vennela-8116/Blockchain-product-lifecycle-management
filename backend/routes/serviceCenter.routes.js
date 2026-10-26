const express = require("express");
const { body } = require("express-validator");
const serviceCenterController = require("../controllers/serviceCenter.controller");
const { protect, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// GET /my — protect, requireRole('serviceCenter')
router.get(
  "/my",
  protect,
  requireRole("serviceCenter"),
  serviceCenterController.getMyServiceCenter
);

// GET / — protect, requireRole('admin')
router.get("/", protect, requireRole("admin"), serviceCenterController.getAllServiceCenters);

// POST / — protect, requireRole('admin')
router.post(
  "/",
  protect,
  requireRole("admin"),
  [
    body("userId").isMongoId().withMessage("Valid userId is required"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("walletAddress").trim().notEmpty().withMessage("Wallet address is required"),
    validate,
  ],
  serviceCenterController.createServiceCenter
);

// GET /:id — protect, requireRole('admin','serviceCenter')
router.get(
  "/:id",
  protect,
  requireRole("admin", "serviceCenter"),
  serviceCenterController.getServiceCenterById
);

// PUT /:id/authorize — protect, requireRole('admin')
router.put(
  "/:id/authorize",
  protect,
  requireRole("admin"),
  serviceCenterController.authorizeServiceCenter
);

// PUT /:id/deactivate — protect, requireRole('admin')
router.put(
  "/:id/deactivate",
  protect,
  requireRole("admin"),
  serviceCenterController.deactivateServiceCenter
);

module.exports = router;
