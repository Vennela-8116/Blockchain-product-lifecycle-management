const express = require("express");
const { body } = require("express-validator");
const eventController = require("../controllers/event.controller");
const { protect, requireRole } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// POST / — protect, requireRole('serviceCenter'), validators
router.post(
  "/",
  protect,
  requireRole("serviceCenter"),
  [
    body("productId").trim().notEmpty().withMessage("productId is required"),
    body("eventType")
      .isIn([
        "REPAIR",
        "MAINTENANCE",
        "INSPECTION",
        "COMPONENT_REPLACEMENT",
        "WARRANTY_CLAIM",
        "OTHER",
      ])
      .withMessage("Invalid eventType"),
    body("title").trim().notEmpty().withMessage("title is required"),
    body("description").trim().notEmpty().withMessage("description is required"),
    body("serviceDate").notEmpty().withMessage("serviceDate is required"),
    validate,
  ],
  eventController.recordEvent
);

// GET /event/:eventId/verify — public
router.get("/event/:eventId/verify", eventController.verifyEvent);

// GET /event/:eventId — protect
router.get("/event/:eventId", protect, eventController.getEventById);

// GET /:productId — protect
router.get("/:productId", protect, eventController.getProductEvents);

module.exports = router;
