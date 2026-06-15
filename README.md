# ⛓️ ChainCert — Decentralized Academic Credential Verification

> Certificates that can't be faked. Verified in seconds. Powered by Ethereum.

ChainCert is a full-stack Web3 application that anchors academic certificates on the Ethereum blockchain. Universities issue credentials on-chain, students hold and share them, and employers verify authenticity instantly — with no central authority.

---

## ✨ What Makes This Different

Most blockchain certificate projects on GitHub are just "mint an NFT." ChainCert goes further:

- **Real 3-party workflow** — Issuer → Student → Verifier, each with a dedicated dashboard
- **IPFS PDF storage** via Pinata — the actual certificate file lives on a decentralized network
- **Revocation + expiry logic** in the smart contract — issuers can invalidate credentials
- **Public verifier** — anyone can verify a cert with just a Cert ID, **no wallet required**
- **Off-chain metadata** in PostgreSQL — keeps the blockchain lean, stores names/emails/tx hashes
- **Full test suite** for the smart contract

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│  /issuer   │  /student   │  /verify (no wallet)         │
└────────────┬────────────┬──────────────────────────────-┘
             │            │
     Ethers.js            │ Axios
             │            │
   ┌──────────────┐  ┌────────────────┐
   │   Ethereum   │  │  Node.js API   │
   │  Sepolia     │  │  Express       │
   │  Testnet     │  └────────┬───────┘
   │              │           │
   │  Solidity    │      PostgreSQL
   │  Contract    │      (metadata)
   └──────────────┘
             │
          Pinata
          (IPFS PDF storage)
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20, Hardhat |
| Blockchain | Ethereum (Sepolia testnet) |
| Frontend | Next.js 14, React, TypeScript |
| Wallet Integration | Ethers.js v6, MetaMask |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| File Storage | IPFS via Pinata |

---

## 📁 Project Structure

```
chaincert/
├── contracts/
│   └── CertificateRegistry.sol   # Core smart contract
├── scripts/
│   └── deploy.js                 # Hardhat deploy script
├── test/
│   └── CertificateRegistry.test.js
├── frontend/
│   ├── pages/
│   │   ├── index.tsx             # Landing page
│   │   ├── issuer/index.tsx      # University dashboard
│   │   ├── student/index.tsx     # Student certificate viewer
│   │   └── verify/index.tsx      # Public verification portal
│   ├── components/
│   │   └── Navbar.tsx
│   ├── utils/
│   │   └── contract.ts           # Ethers.js helpers + ABI
│   └── styles/globals.css
├── backend/
│   ├── index.js                  # Express entry point
│   ├── routes/
│   │   ├── certificates.js       # CRUD for cert metadata
│   │   ├── ipfs.js               # Pinata PDF upload
│   │   └── issuers.js
│   └── db/
│       ├── client.js             # PostgreSQL pool
│       └── schema.sql            # DB migrations
├── hardhat.config.js
├── .env.example
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- MetaMask browser extension
- PostgreSQL running locally
- [Pinata](https://pinata.cloud) account (free tier works)
- [Infura](https://infura.io) or [Alchemy](https://alchemy.com) account for Sepolia RPC

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/chaincert.git
cd chaincert

# Install root (Hardhat) dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend  && npm install && cd ..
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env and fill in your keys
```

### 3. Set Up the Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE chaincert;"

# Run the schema
psql -U postgres -d chaincert -f backend/db/schema.sql
```

### 4. Compile & Deploy the Smart Contract

```bash
# Compile
npm run compile

# Start local Hardhat node (terminal 1)
npm run node

# Deploy to local node (terminal 2)
npm run deploy:local

# Or deploy to Sepolia testnet
npm run deploy:sepolia
```

Copy the deployed contract address into your `.env`:
```
CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

### 5. Run the App

```bash
# Terminal 1 — Backend API
npm run backend

# Terminal 2 — Frontend
npm run frontend
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🧪 Running Tests

```bash
npm test
```

Tests cover: admin access control, issuer authorization, certificate issuance, revocation, and verification status.

---

## 📋 Smart Contract: Key Functions

| Function | Who Can Call | Description |
|---|---|---|
| `addIssuer(address, name)` | Admin | Authorize an institution |
| `revokeIssuer(address)` | Admin | Remove an institution's rights |
| `issueCertificate(...)` | Authorized Issuer | Issue a certificate on-chain |
| `revokeCertificate(certId)` | Original Issuer | Invalidate a certificate |
| `verifyCertificate(certId)` | Anyone (view) | Returns `valid`, `status`, and full cert data |
| `getStudentCertificates(addr)` | Anyone (view) | Returns all cert IDs for a student |

---

## 🌐 User Flows

### Issuer (University)
1. Connect MetaMask wallet (must be added as issuer by admin)
2. Fill in student details and upload PDF certificate
3. Click "Issue Certificate" → PDF uploads to IPFS, cert anchored on-chain
4. Share the generated Cert ID with the student

### Student
1. Connect MetaMask wallet
2. View all certificates issued to your address
3. Copy your Cert ID to share with employers
4. Download original PDF from IPFS

### Verifier (Employer / Anyone)
1. Visit `/verify` — no wallet needed
2. Paste the Cert ID
3. Instantly see: ✅ VALID / 🚫 REVOKED / ⏰ EXPIRED + full certificate details

---

## 🤝 Contributing

Pull requests are welcome! For major changes please open an issue first.

---

## 📄 License

MIT
