import Head from "next/head";
import { useState } from "react";
import Navbar from "../../components/Navbar";
import { getContract, connectWallet } from "../../utils/contract";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function IssuerPage() {
  const [wallet,      setWallet]      = useState("");
  const [loading,     setLoading]     = useState(false);
  const [status,      setStatus]      = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [issuedCertId, setIssuedCertId] = useState("");

  // Form state
  const [form, setForm] = useState({
    studentWallet: "",
    studentName:   "",
    studentEmail:  "",
    course:        "",
    grade:         "",
    validityDays:  "1825", // 5 years default
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  async function handleConnect() {
    const addr = await connectWallet();
    setWallet(addr);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleIssueCert() {
    if (!wallet) return alert("Please connect your wallet first.");
    if (!pdfFile) return alert("Please upload a PDF certificate.");
    const { studentWallet, studentName, course, grade, validityDays } = form;
    if (!studentWallet || !studentName || !course) return alert("Fill all required fields.");

    setLoading(true);
    setStatus(null);
    try {
      // 1. Upload PDF to IPFS via backend
      const fd = new FormData();
      fd.append("certificate", pdfFile);
      fd.append("name", `${studentName}_${course}`);
      const ipfsRes = await axios.post(`${API}/api/ipfs/upload`, fd);
      const { ipfsHash } = ipfsRes.data;

      // 2. Issue on-chain
      const contract = await getContract(true);
      const tx = await contract.issueCertificate(
        studentWallet, studentName, course, grade, ipfsHash, Number(validityDays)
      );
      const receipt = await tx.wait();

      // 3. Parse certId from event
      const event = receipt.logs.find((l: any) => l.fragment?.name === "CertificateIssued");
      const certId = event?.args[0] || "";

      // 4. Save metadata to backend DB
      await axios.post(`${API}/api/certificates`, {
        certId,
        studentName,
        studentWallet: form.studentWallet,
        studentEmail:  form.studentEmail,
        course,
        grade,
        issuerWallet: wallet,
        ipfsHash,
        expiresAt: validityDays !== "0" ? new Date(Date.now() + Number(validityDays) * 86400000).toISOString() : null,
        txHash: receipt.hash,
      });

      setIssuedCertId(certId);
      setStatus({ type: "success", msg: `Certificate issued! Cert ID: ${certId}` });
      setForm({ studentWallet: "", studentName: "", studentEmail: "", course: "", grade: "", validityDays: "1825" });
      setPdfFile(null);
    } catch (err: any) {
      setStatus({ type: "error", msg: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    const certId = prompt("Enter the Certificate ID to revoke:");
    if (!certId) return;
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.revokeCertificate(certId);
      await tx.wait();
      await axios.patch(`${API}/api/certificates/${certId}/revoke`);
      setStatus({ type: "success", msg: "Certificate successfully revoked." });
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Issuer Dashboard — ChainCert</title></Head>
      <Navbar />
      <main style={{ maxWidth: "700px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.5rem" }}>🏛️ Issuer Dashboard</h1>
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>Issue and manage academic certificates on-chain.</p>

        {!wallet && (
          <div className="card" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <p style={{ marginBottom: "1rem", color: "var(--muted)" }}>Connect your institution wallet to continue</p>
            <button className="btn-primary" onClick={handleConnect}>Connect MetaMask</button>
          </div>
        )}

        {wallet && (
          <div style={{ background: "#0d2137", border: "1px solid #1e3a5f", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "2rem", fontSize: "0.875rem", color: "var(--accent2)" }}>
            Connected: {wallet}
          </div>
        )}

        {status && (
          <div style={{
            background: status.type === "success" ? "#064e3b" : "#450a0a",
            border: `1px solid ${status.type === "success" ? "#10b981" : "#ef4444"}`,
            color: status.type === "success" ? "#34d399" : "#fca5a5",
            borderRadius: 8, padding: "1rem", marginBottom: "2rem", wordBreak: "break-all",
          }}>
            {status.msg}
            {issuedCertId && (
              <button onClick={() => navigator.clipboard.writeText(issuedCertId)}
                style={{ marginLeft: "1rem", background: "none", border: "1px solid currentColor", color: "inherit", borderRadius: 4, padding: "0.2rem 0.5rem", cursor: "pointer", fontSize: "0.8rem" }}>
                Copy ID
              </button>
            )}
          </div>
        )}

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Issue New Certificate</h2>

          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: 6 }}>Student Wallet Address *</label>
            <input className="input" name="studentWallet" value={form.studentWallet} onChange={handleChange} placeholder="0x..." />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: 6 }}>Student Full Name *</label>
            <input className="input" name="studentName" value={form.studentName} onChange={handleChange} placeholder="Ravi Kumar" />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: 6 }}>Student Email</label>
            <input className="input" name="studentEmail" value={form.studentEmail} onChange={handleChange} placeholder="ravi@example.com" type="email" />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: 6 }}>Course / Degree *</label>
            <input className="input" name="course" value={form.course} onChange={handleChange} placeholder="B.Tech Computer Science" />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: 6 }}>Grade / Division</label>
            <input className="input" name="grade" value={form.grade} onChange={handleChange} placeholder="First Class with Distinction" />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: 6 }}>Validity (days, 0 = no expiry)</label>
            <input className="input" name="validityDays" value={form.validityDays} onChange={handleChange} type="number" min="0" />
          </div>
          <div>
            <label style={{ fontSize: "0.85rem", color: "var(--muted)", display: "block", marginBottom: 6 }}>Upload Certificate PDF *</label>
            <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)}
              style={{ color: "var(--text)", fontSize: "0.9rem" }} />
            {pdfFile && <p style={{ color: "var(--accent2)", fontSize: "0.8rem", marginTop: 4 }}>✓ {pdfFile.name}</p>}
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={handleIssueCert} disabled={loading || !wallet} style={{ flex: 1 }}>
              {loading ? "Processing..." : "Issue Certificate"}
            </button>
            <button className="btn-danger" onClick={handleRevoke} disabled={loading || !wallet}>
              Revoke
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
