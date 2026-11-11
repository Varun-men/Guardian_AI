import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div>
          <div className="logo" style={{ marginBottom: "8px", color: "var(--t1)" }}>
            Guardian AI
          </div>
          Built by The Bloodline for the Inkloom AI Challenge
        </div>
        <div>
          <h4>Product</h4>
          <Link href="/menu">Menu</Link> ·{" "}
          <Link href="/demo">Analyze</Link> ·{" "}
          <Link href="/demo">Review</Link> ·{" "}
          <Link href="/demo">Ledger</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link href="/login">Admin login</Link>
        </div>
      </div>
    </footer>
  );
}
