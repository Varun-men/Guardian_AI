"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <div className="bar">
      <div className="wrap">
        <nav>
          <Link className="logo" href="#top" aria-label="Guardian AI">
            <svg width="24" height="24" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="2" y="3" width="9" height="3" rx="1.5" fill="#e0343c" />
              <rect x="2" y="8.5" width="16" height="3" rx="1.5" fill="#f7ece8" />
              <rect x="2" y="14" width="12" height="3" rx="1.5" fill="#f7ece8" opacity=".5" />
            </svg>
            Guardian AI
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
            <Link className="pill red" href="/demo">
              Explore demo
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
