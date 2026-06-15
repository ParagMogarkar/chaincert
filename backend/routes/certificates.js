const express = require("express");
const router  = express.Router();
const db      = require("../db/client");

// POST /api/certificates — save cert metadata after on-chain issue
router.post("/", async (req, res) => {
  try {
    const {
      certId, studentName, studentWallet, studentEmail,
      course, grade, issuerWallet, ipfsHash, expiresAt, txHash,
    } = req.body;

    if (!certId || !studentName || !studentWallet || !course || !issuerWallet || !ipfsHash) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await db.query(
      `INSERT INTO certificates
         (cert_id, student_name, student_wallet, student_email,
          course, grade, issuer_wallet, ipfs_hash, expires_at, tx_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [certId, studentName, studentWallet, studentEmail ?? null,
       course, grade ?? null, issuerWallet, ipfsHash,
       expiresAt ? new Date(expiresAt) : null, txHash ?? null]
    );

    res.status(201).json({ success: true, certificate: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/certificates/:certId — fetch one cert by ID
router.get("/:certId", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, i.institution AS issuer_institution
       FROM certificates c
       LEFT JOIN issuers i ON c.issuer_wallet = i.wallet_address
       WHERE c.cert_id = $1`,
      [req.params.certId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Certificate not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/certificates/student/:wallet — all certs for a student
router.get("/student/:wallet", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, i.institution AS issuer_institution
       FROM certificates c
       LEFT JOIN issuers i ON c.issuer_wallet = i.wallet_address
       WHERE LOWER(c.student_wallet) = LOWER($1)
       ORDER BY c.issued_at DESC`,
      [req.params.wallet]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/certificates/:certId/revoke — mark revoked in DB
router.patch("/:certId/revoke", async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE certificates SET revoked = true WHERE cert_id = $1 RETURNING *`,
      [req.params.certId]
    );
    if (!result.rows.length) {
      return res.status(404).json({ error: "Certificate not found" });
    }
    res.json({ success: true, certificate: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
