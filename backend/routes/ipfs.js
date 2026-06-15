const express  = require("express");
const multer   = require("multer");
const axios    = require("axios");
const FormData = require("form-data");
const router   = express.Router();

// Store file in memory (not disk) before uploading to Pinata
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/ipfs/upload — upload PDF to Pinata IPFS
router.post("/upload", upload.single("certificate"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are accepted" });
    }

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename:    req.file.originalname,
      contentType: "application/pdf",
    });

    // Optional metadata
    const metadata = JSON.stringify({ name: req.body.name || req.file.originalname });
    form.append("pinataMetadata", metadata);

    const pinataRes = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      form,
      {
        maxBodyLength: Infinity,
        headers: {
          ...form.getHeaders(),
          pinata_api_key:        process.env.PINATA_API_KEY,
          pinata_secret_api_key: process.env.PINATA_SECRET_KEY,
        },
      }
    );

    const { IpfsHash, PinSize } = pinataRes.data;
    res.json({
      success:  true,
      ipfsHash: IpfsHash,
      size:     PinSize,
      url:      `https://gateway.pinata.cloud/ipfs/${IpfsHash}`,
    });
  } catch (err) {
    console.error("Pinata error:", err.response?.data || err.message);
    res.status(500).json({ error: "IPFS upload failed", details: err.message });
  }
});

module.exports = router;
