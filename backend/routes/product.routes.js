const express = require("express");
const { body } = require("express-validator");
const productController = require("../controllers/product.controller");
const { protect, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// GET /owner/my — owner: return products owned by me
router.get("/owner/my", protect, requireRole("owner", "admin"), productController.getMyProducts);

// GET / — protect, requireRole('admin')
router.get("/", protect, requireRole("admin"), productController.getAllProducts);

// POST / — protect, requireRole('admin'), validators
router.post(
  "/",
  protect,
  requireRole("admin"),
  [
    body("serialNumber").trim().notEmpty().withMessage("Serial number is required"),
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("brand").trim().notEmpty().withMessage("Brand is required"),
    body("model").trim().notEmpty().withMessage("Model is required"),
    body("category")
      .optional()
      .isIn(["laptop", "phone", "tablet", "appliance", "vehicle", "other"])
      .withMessage("Invalid category"),
    body("status")
      .optional()
      .isIn(["active", "inactive", "recalled"])
      .withMessage("Invalid status"),
    validate,
  ],
  productController.createProduct
);

// GET /search — protect, requireRole('admin','serviceCenter')
router.get(
  "/search",
  protect,
  requireRole("admin", "serviceCenter"),
  productController.searchProducts
);

// GET /verify/:productId — public (no auth)
router.get("/verify/:productId", productController.verifyProduct);

// GET /:productId — protect
router.get("/:productId", protect, productController.getProductById);

// PUT /:productId/status — protect, requireRole('admin')
router.put(
  "/:productId/status",
  protect,
  requireRole("admin"),
  [
    body("status")
      .isIn(["active", "inactive", "recalled"])
      .withMessage("Status must be active, inactive, or recalled"),
    validate,
  ],
  productController.updateProductStatus
);

module.exports = router;
