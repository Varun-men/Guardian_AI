"use client";

import Link from "next/link";
import { BrandShield } from "@/components/BrandShield";

export function Navbar() {
  return (
    <div className="bar">
      <div className="wrap">
        <nav>
          <Link className="logo" href="#top" aria-label="Guardian AI">
            <BrandShield size={26} />
            <span style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Guardian<span style={{ color: "var(--blood)", fontWeight: 400 }}> AI</span></span>
          </Link>
          <div className="nl">
            <a className="h" href="#cards">
              How it works
            </a>
            <a className="h" href="#what">
              What it does
            </a>
            <a className="h" href="#faq">
              FAQ
            </a>
            <Link className="h" href="/menu">
              Menu
            </Link>
            <Link className="h" href="/login">
              Admin
            </Link>
            <Link className="pill red" href="/analyze">
              Explore demo
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
