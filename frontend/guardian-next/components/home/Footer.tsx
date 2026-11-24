import Link from "next/link";
import { BrandShield } from "@/components/BrandShield";

export function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div>
          <div className="logo" style={{ marginBottom: "8px", color: "var(--t1)", display: "flex", alignItems: "center", gap: "8px" }}>
            <BrandShield size={20} />
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
