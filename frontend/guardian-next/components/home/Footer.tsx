import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div>
          <div className="logo" style={{ marginBottom: "8px", color: "var(--t1)", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B" />
              <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontWeight: 700 }}>Guardian<span style={{ color: "var(--blood)", fontWeight: 400 }}> AI</span></span>
          </div>
          Built by The Bloodline for the Inkloom AI Challenge
        </div>
        <div>
          <h4>Product</h4>
          <Link href="/menu">Menu</Link> ·{" "}
          <Link href="/analyze">Analyze</Link> ·{" "}
          <Link href="/review">Review</Link> ·{" "}
          <Link href="/ledger">Ledger</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link href="/login">Admin login</Link> ·{" "}
          <Link href="/register">Register</Link>
        </div>
      </div>
    </footer>
  );
}
