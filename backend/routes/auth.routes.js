const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// POST /register — validate name, email, password (min 6), role (optional)
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["admin", "owner", "serviceCenter"])
      .withMessage("Role must be admin, owner, or serviceCenter"),
    validate,
  ],
  authController.register
);

// POST /login — validate email, password
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    validate,
  ],
  authController.login
);

// GET /me — protect
router.get("/me", protect, authController.getMe);

module.exports = router;
