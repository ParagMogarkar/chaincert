import Link from "next/link";
import { useState } from "react";
import { connectWallet, shortenAddress } from "../utils/contract";

export default function Navbar() {
  const [wallet, setWallet] = useState<string>("");

  async function handleConnect() {
    try {
      const addr = await connectWallet();
      setWallet(addr);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "1rem 2rem", borderBottom: "1px solid var(--border)",
      background: "var(--surface)", position: "sticky", top: 0, zIndex: 100,
    }}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--accent)" }}>
          Chain<span style={{ color: "var(--accent2)" }}>Cert</span>
        </span>
      </Link>

      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <Link href="/issuer"  style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>Issuer</Link>
        <Link href="/student" style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>Student</Link>
        <Link href="/verify"  style={{ color: "var(--muted)", textDecoration: "none", fontWeight: 500 }}>Verify</Link>

        <button className="btn-primary" onClick={handleConnect} style={{ fontSize: "0.875rem" }}>
          {wallet ? shortenAddress(wallet) : "Connect Wallet"}
        </button>
      </div>
    </nav>
  );
}
