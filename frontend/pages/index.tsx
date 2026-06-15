import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Navbar";

export default function Home() {
  const roles = [
    {
      icon: "🏛️",
      title: "Issuer",
      subtitle: "University / Institution",
      desc: "Issue tamper-proof certificates to students, upload PDFs to IPFS, and revoke credentials when needed.",
      href: "/issuer",
      color: "#3b82f6",
    },
    {
      icon: "🎓",
      title: "Student",
      subtitle: "Certificate Holder",
      desc: "View all credentials issued to your wallet. Download originals and share your cert ID with employers.",
      href: "/student",
      color: "#06b6d4",
    },
    {
      icon: "🔍",
      title: "Verify",
      subtitle: "Employer / Anyone",
      desc: "Paste any certificate ID to instantly verify its authenticity, status, and expiry. No wallet needed.",
      href: "/verify",
      color: "#10b981",
    },
  ];

  return (
    <>
      <Head>
        <title>ChainCert — Blockchain Credential Verification</title>
        <meta name="description" content="Decentralized academic certificate verification on Ethereum" />
      </Head>

      <Navbar />

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "4rem 1.5rem" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{
            display: "inline-block", background: "#1e3a5f", color: "var(--accent2)",
            borderRadius: "20px", padding: "0.3rem 1rem", fontSize: "0.8rem",
            fontWeight: 700, letterSpacing: "0.05em", marginBottom: "1.5rem",
          }}>
            POWERED BY ETHEREUM
          </div>
          <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "1.25rem" }}>
            Certificates that can't be faked.<br />
            <span style={{
              background: "linear-gradient(90deg, var(--accent), var(--accent2))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Verified in seconds.
            </span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "1.15rem", maxWidth: "580px", margin: "0 auto 2rem" }}>
            ChainCert anchors academic credentials on-chain. Issue, share, and verify
            degrees and certificates — all without trusting a central authority.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/issuer"><button className="btn-primary" style={{ fontSize: "1rem", padding: "0.8rem 2rem" }}>Issue Certificate</button></Link>
            <Link href="/verify"><button style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", borderRadius: "8px", padding: "0.8rem 2rem", fontSize: "1rem", cursor: "pointer" }}>Verify a Certificate</button></Link>
          </div>
        </div>

        {/* Role cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          {roles.map((r) => (
            <Link key={r.href} href={r.href} style={{ textDecoration: "none" }}>
              <div className="card" style={{ cursor: "pointer", transition: "border-color 0.2s", height: "100%" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = r.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{r.icon}</div>
                <div style={{ color: r.color, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "0.25rem" }}>{r.subtitle.toUpperCase()}</div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.6rem" }}>{r.title}</h2>
                <p style={{ color: "var(--muted)", lineHeight: 1.6, fontSize: "0.95rem" }}>{r.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginTop: "5rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "2rem", textAlign: "center" }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              ["1", "University uploads PDF to IPFS and issues cert on-chain"],
              ["2", "A unique Cert ID is generated and stored in the smart contract"],
              ["3", "Student receives their Cert ID to share with anyone"],
              ["4", "Employers verify instantly — no login, no middleman"],
            ].map(([n, t]) => (
              <div key={n} className="card" style={{ textAlign: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, margin: "0 auto 1rem", fontSize: "1.1rem" }}>{n}</div>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
