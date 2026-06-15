require("dotenv").config({ path: "../.env" });
const express = require("express");
const cors    = require("cors");

const certRoutes   = require("./routes/certificates");
const ipfsRoutes   = require("./routes/ipfs");
const issuerRoutes = require("./routes/issuers");

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use("/api/certificates", certRoutes);
app.use("/api/ipfs",         ipfsRoutes);
app.use("/api/issuers",      issuerRoutes);

// ── Health check ─────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date() }));

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

// ── Error handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🚀 ChainCert backend running on http://localhost:${PORT}`);
});
