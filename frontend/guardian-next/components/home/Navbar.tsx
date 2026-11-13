"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <div className="bar">
      <div className="wrap">
        <nav>
          <Link className="logo" href="#top" aria-label="Guardian AI">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B" />
              <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" stroke="#F2675F" strokeWidth="0.5" fill="none" opacity="0.4" />
              <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
