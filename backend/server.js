require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const morgan     = require("morgan");
const connectDB  = require("./config/db");

// Routes
const authRoutes           = require("./routes/auth.routes");
const productRoutes        = require("./routes/product.routes");
const eventRoutes          = require("./routes/event.routes");
const transferRoutes       = require("./routes/transfer.routes");
const serviceCenterRoutes  = require("./routes/serviceCenter.routes");
const blockchainRoutes     = require("./routes/blockchain.routes");

const app = express();

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

// ── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",            authRoutes);
app.use("/api/products",        productRoutes);
app.use("/api/events",          eventRoutes);
app.use("/api/transfers",       transferRoutes);
app.use("/api/service-centers", serviceCenterRoutes);
app.use("/api/blockchain",      blockchainRoutes);

// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error", detail: err.message });
});

// ── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`✅ RepairChain API running on port ${PORT}`);
    });
  });
}

module.exports = app;
