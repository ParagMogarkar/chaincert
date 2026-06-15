import Head from "next/head";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import { getContract, connectWallet, formatTimestamp, shortenAddress } from "../../utils/contract";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface CertMeta {
  cert_id: string;
  student_name: string;
  course: string;
  grade: string;
  ipfs_hash: string;
  issuer_institution: string;
  issued_at: string;
  expires_at: string | null;
  revoked: boolean;
  tx_hash: string;
}

export default function StudentPage() {
  const [wallet, setWallet]   = useState("");
  const [certs,  setCerts]    = useState<CertMeta[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const addr = await connectWallet();
      setWallet(addr);
      const res = await axios.get(`${API}/api/certificates/student/${addr}`);
      setCerts(res.data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    alert("Cert ID copied to clipboard!");
  }

  return (
    <>
      <Head><title>Student Dashboard — ChainCert</title></Head>
      <Navbar />
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>🎓 My Certificates</h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>View all credentials issued to your wallet address.</p>

        {!wallet && (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>Connect your wallet to view your certificates</p>
            <button className="btn-primary" onClick={handleConnect} disabled={loading}>
              {loading ? "Connecting..." : "Connect MetaMask"}
            </button>
          </div>
        )}

        {wallet && (
          <div style={{ background: "#0d2137", border: "1px solid #1e3a5f", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "2rem", fontSize: "0.875rem", color: "var(--accent2)" }}>
            Wallet: {wallet}
          </div>
        )}

        {wallet && certs.length === 0 && !loading && (
          <div className="card" style={{ textAlign: "center", color: "var(--muted)" }}>
            No certificates found for this wallet.
          </div>
        )}

        {certs.map(cert => (
          <div key={cert.cert_id} className="card" style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
              <div>
                <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.25rem" }}>{cert.course}</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{cert.issuer_institution || shortenAddress(cert.cert_id)}</p>
              </div>
              <span className={cert.revoked ? "badge-revoked" : "badge-valid"}>
                {cert.revoked ? "REVOKED" : "VALID"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "1rem", fontSize: "0.875rem" }}>
              <div><span style={{ color: "var(--muted)" }}>Name</span><br />{cert.student_name}</div>
              <div><span style={{ color: "var(--muted)" }}>Grade</span><br />{cert.grade || "—"}</div>
              <div><span style={{ color: "var(--muted)" }}>Issued</span><br />{new Date(cert.issued_at).toLocaleDateString("en-IN")}</div>
              <div><span style={{ color: "var(--muted)" }}>Expires</span><br />{cert.expires_at ? new Date(cert.expires_at).toLocaleDateString("en-IN") : "Never"}</div>
            </div>

            <div style={{ marginTop: "1rem", background: "var(--bg)", borderRadius: 6, padding: "0.6rem 0.8rem", fontSize: "0.75rem", color: "var(--muted)", wordBreak: "break-all" }}>
              <span style={{ color: "var(--accent)" }}>Cert ID: </span>{cert.cert_id}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <button className="btn-primary" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
                onClick={() => copyId(cert.cert_id)}>
                Copy Cert ID
              </button>
              {cert.ipfs_hash && (
                <a href={`https://gateway.pinata.cloud/ipfs/${cert.ipfs_hash}`} target="_blank" rel="noreferrer">
                  <button style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 8, padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.85rem" }}>
                    Download PDF ↗
                  </button>
                </a>
              )}
            </div>
          </div>
        ))}
      </main>
    </>
  );
}
