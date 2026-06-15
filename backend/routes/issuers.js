const express = require("express");
const router  = express.Router();
const db      = require("../db/client");

// POST /api/issuers — register an issuer
router.post("/", async (req, res) => {
  try {
    const { walletAddress, institution } = req.body;
    if (!walletAddress || !institution) {
      return res.status(400).json({ error: "walletAddress and institution are required" });
    }

    const result = await db.query(
      `INSERT INTO issuers (wallet_address, institution)
       VALUES ($1, $2)
       ON CONFLICT (wallet_address) DO UPDATE SET institution = EXCLUDED.institution
       RETURNING *`,
      [walletAddress.toLowerCase(), institution]
    );
    res.status(201).json({ success: true, issuer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/issuers/:wallet
router.get("/:wallet", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM issuers WHERE wallet_address = $1",
      [req.params.wallet.toLowerCase()]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Issuer not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
