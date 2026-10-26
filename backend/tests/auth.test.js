const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../server");
const User = require("../models/User");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_123456789";

const TEST_DB_URI =
  process.env.MONGODB_URI_TEST ||
  "mongodb://localhost:27017/repairchain_test";

describe("Auth Controller Tests (/api/auth)", () => {
  let mongoConnected = false;
  let authToken = null;
  const testUser = {
    name: "Auth Test User",
    email: "authtest@testauth.com",
    password: "Password123!",
    role: "owner",
  };

  beforeAll(async () => {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(TEST_DB_URI, { serverSelectionTimeoutMS: 3000 });
      }
      mongoConnected = true;
      await User.deleteMany({ email: { $regex: /@testauth\.com$/i } });
    } catch (err) {
      console.warn("⚠️ Test MongoDB not connected. Tests requiring active DB will be skipped.", err.message);
    }
  });

  afterAll(async () => {
    if (mongoConnected) {
      try {
        await User.deleteMany({ email: { $regex: /@testauth\.com$/i } });
        await mongoose.connection.close();
      } catch (err) {
        console.warn("⚠️ Teardown error:", err.message);
      }
    }
  });

  // ── POST /api/auth/register ────────────────────────────────────────────────
  describe("POST /api/auth/register", () => {
    it("should successfully register a new user and return JWT + user", async () => {
      if (!mongoConnected) return;

      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user.role).toBe("owner");
      expect(res.body.user).not.toHaveProperty("password");

      authToken = res.body.token;
    });

    it("should reject registration with duplicate email", async () => {
      if (!mongoConnected) return;

      const res = await request(app)
        .post("/api/auth/register")
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/already registered/i);
    });

    it("should reject registration with missing or invalid fields", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          name: "",
          email: "invalid-email-format",
          password: "123", // less than 6 chars
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/validation failed/i);
    });
  });

  // ── POST /api/auth/login ───────────────────────────────────────────────────
  describe("POST /api/auth/login", () => {
    it("should successfully log in with valid credentials", async () => {
      if (!mongoConnected) return;

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      authToken = res.body.token;
    });

    it("should reject login with wrong password", async () => {
      if (!mongoConnected) return;

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: testUser.email,
          password: "WrongPassword999!",
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    it("should reject login with non-existent email", async () => {
      if (!mongoConnected) return;

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nobody_here@testauth.com",
          password: "Password123!",
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toMatch(/invalid email or password/i);
    });
  });

  // ── GET /api/auth/me ───────────────────────────────────────────────────────
  describe("GET /api/auth/me", () => {
    it("should return the current user profile with valid Bearer token", async () => {
      if (!mongoConnected || !authToken) return;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email.toLowerCase());
      expect(res.body.name).toBe(testUser.name);
      expect(res.body).not.toHaveProperty("password");
    });

    it("should reject request without Authorization token", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error");
    });
  });
});
