import Head from "next/head";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import { getContract, formatTimestamp } from "../../utils/contract";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function VerifyPage() {
  const [certId,  setCertId]  = useState("");
  const [result,  setResult]  = useState<any>(null);
  const [meta,    setMeta]    = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function handleVerify() {
    if (!certId.trim()) return;
    setLoading(true);
    setResult(null);
    setMeta(null);
    setError("");

    try {
      // Query the smart contract (read-only, no wallet needed)
      const contract = await getContract(false);
      const [valid, status, cert] = await contract.verifyCertificate(certId.trim());
      setResult({ valid, status, cert });

      // Fetch off-chain metadata from backend
      try {
        const metaRes = await axios.get(`${API}/api/certificates/${certId.trim()}`);
        setMeta(metaRes.data);
      } catch (_) {
        // metadata optional
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please check the Cert ID.");
    } finally {
      setLoading(false);
    }
  }

  const statusColor  = result?.status === "VALID" ? "var(--valid)" : result?.status === "REVOKED" ? "var(--revoked)" : "var(--expired)";
  const statusBadge  = result?.status === "VALID" ? "badge-valid" : result?.status === "REVOKED" ? "badge-revoked" : "badge-expired";

  return (
    <>
      <Head><title>Verify Certificate — ChainCert</title></Head>
      <Navbar />
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>🔍 Verify a Certificate</h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
          No wallet needed. Paste any Certificate ID to instantly verify its authenticity.
        </p>

        <div className="card" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <input
            className="input"
            value={certId}
            onChange={e => setCertId(e.target.value)}
            placeholder="0x1a2b3c... (Certificate ID)"
            style={{ flex: 1 }}
            onKeyDown={e => e.key === "Enter" && handleVerify()}
          />
          <button className="btn-primary" onClick={handleVerify} disabled={loading || !certId.trim()}>
            {loading ? "Checking..." : "Verify"}
          </button>
        </div>

        {error && (
          <div style={{ background: "#450a0a", border: "1px solid #ef4444", color: "#fca5a5", borderRadius: 8, padding: "1rem", marginTop: "1.5rem" }}>
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="card" style={{ marginTop: "1.5rem" }}>
            {/* Status Banner */}
            <div style={{
              display: "flex", alignItems: "center", gap: "1rem",
              padding: "1rem", borderRadius: 8, marginBottom: "1.5rem",
              background: result.valid ? "#064e3b22" : "#450a0a22",
              border: `1px solid ${statusColor}`,
            }}>
              <span style={{ fontSize: "2rem" }}>{result.valid ? "✅" : result.status === "REVOKED" ? "🚫" : "⏰"}</span>
              <div>
                <span className={statusBadge}>{result.status}</span>
                <p style={{ color: statusColor, fontWeight: 700, fontSize: "1.1rem", marginTop: "0.25rem" }}>
                  {result.valid
                    ? "This certificate is authentic and valid."
                    : result.status === "REVOKED"
                    ? "This certificate has been revoked by the issuer."
                    : "This certificate has expired."}
                </p>
              </div>
            </div>

            {/* Certificate Details */}
            {result.cert?.issuedAt > 0n && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>STUDENT NAME</span>
                  <p style={{ fontWeight: 600 }}>{result.cert.studentName}</p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>COURSE</span>
                  <p style={{ fontWeight: 600 }}>{result.cert.course}</p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>GRADE</span>
                  <p style={{ fontWeight: 600 }}>{result.cert.grade || "—"}</p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>ISSUED</span>
                  <p style={{ fontWeight: 600 }}>{formatTimestamp(result.cert.issuedAt)}</p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>EXPIRES</span>
                  <p style={{ fontWeight: 600 }}>
                    {result.cert.expiresAt === 0n ? "Never" : formatTimestamp(result.cert.expiresAt)}
                  </p>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>INSTITUTION</span>
                  <p style={{ fontWeight: 600 }}>{meta?.issuer_institution || "—"}</p>
                </div>
                <div style={{ gridColumn: "1/-1" }}>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>ISSUER WALLET</span>
                  <p style={{ fontWeight: 600, wordBreak: "break-all", fontSize: "0.85rem" }}>{result.cert.issuedBy}</p>
                </div>
              </div>
            )}

            {/* PDF Link */}
            {meta?.ipfs_hash && (
              <a href={`https://gateway.pinata.cloud/ipfs/${meta.ipfs_hash}`} target="_blank" rel="noreferrer"
                style={{ display: "inline-block", marginTop: "1.5rem" }}>
                <button style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.875rem" }}>
                  View Original Certificate PDF ↗
                </button>
              </a>
            )}
          </div>
        )}

        {/* Info note */}
        <div style={{ marginTop: "2rem", padding: "1rem", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.85rem", color: "var(--muted)" }}>
          💡 This verification reads directly from the Ethereum blockchain — it cannot be forged or tampered with.
        </div>
      </main>
    </>
  );
}
