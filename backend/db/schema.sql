-- Run this once to set up the ChainCert database schema
-- psql -d chaincert -f schema.sql

CREATE TABLE IF NOT EXISTS issuers (
    wallet_address  VARCHAR(42)  PRIMARY KEY,
    institution     VARCHAR(255) NOT NULL,
    verified        BOOLEAN      DEFAULT false,
    created_at      TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
    cert_id         VARCHAR(66)  PRIMARY KEY,   -- bytes32 as hex string
    student_name    VARCHAR(255) NOT NULL,
    student_wallet  VARCHAR(42)  NOT NULL,
    student_email   VARCHAR(255),
    course          VARCHAR(255) NOT NULL,
    grade           VARCHAR(50),
    issuer_wallet   VARCHAR(42)  REFERENCES issuers(wallet_address),
    ipfs_hash       VARCHAR(100) NOT NULL,
    issued_at       TIMESTAMP    DEFAULT NOW(),
    expires_at      TIMESTAMP,
    revoked         BOOLEAN      DEFAULT false,
    tx_hash         VARCHAR(66)              -- blockchain tx hash
);

CREATE INDEX IF NOT EXISTS idx_certs_student  ON certificates(student_wallet);
CREATE INDEX IF NOT EXISTS idx_certs_issuer   ON certificates(issuer_wallet);
CREATE INDEX IF NOT EXISTS idx_certs_revoked  ON certificates(revoked);
