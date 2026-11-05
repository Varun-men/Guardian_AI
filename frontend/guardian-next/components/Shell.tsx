"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useLedgerStore } from "@/lib/ledger-store";

/* ─── Tokens ─── */
const C = {
  neon: "#00c8ff",
  yellow: "#ffe600",
  blue: "#0070a8",
  text: "#e8f4ff",
  sub: "#7ab3cc",
  muted: "#3d6070",
  border: "rgba(0,200,255,0.14)",
  high: "#ff4d6d",
  ok: "#00e5a0",
};

/* ─── Page titles ─── */
const PAGE_LABELS: Record<string, string> = {
  "/": "Review Session",
  "/review": "Review Session",
  "/analyze": "Analyze Draft",
  "/admin": "Fact Registry",
  "/ledger": "Living Ledger",
  "/analytics": "Analytics",
};

/* ─── Minimal SVG icons ─── */
const Ico = {
  shield: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  analyze: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  review: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5l8-3z" />
    </svg>
  ),
  admin: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
    </svg>
  ),
  ledger: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  settings: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  logout: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  search: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  filter: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  ),
  warn: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const NAV_TABS = [
  { href: "/analyze", label: "Analyze", icon: Ico.analyze },
  { href: "/review", label: "Review", icon: Ico.review },
  { href: "/admin", label: "Fact Registry", icon: Ico.admin },
  { href: "/ledger", label: "Ledger", icon: Ico.ledger },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { facts, posts, audit, staleCount } = useLedgerStore();
  const [search, setSearch] = useState("");
  const pageLabel = PAGE_LABELS[path] ?? "Guardian AI";

  return (
    <>
      <style>{`
        .top-nav-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 600;
          color: #7ab3cc;
          text-decoration: none;
          border: 1px solid transparent;
          transition: all .2s cubic-bezier(0.16,1,0.3,1);
          white-space: nowrap;
        }
        .top-nav-tab:hover {
          color: #e8f4ff;
          background: rgba(0,200,255,0.06);
          border-color: rgba(0,200,255,0.2);
        }
        .top-nav-tab.active {
          color: #00c8ff;
          background: linear-gradient(135deg, rgba(0,200,255,0.14) 0%, rgba(0,200,255,0.04) 100%);
          border-color: #00c8ff;
          box-shadow: 0 0 16px rgba(0,200,255,0.2);
        }

        .top-search-wrap {
          position: relative;
          width: 260px;
          transition: width 0.25s ease;
        }
        .top-search-wrap:focus-within {
          width: 320px;
        }
        .top-search-wrap input {
          width: 100%;
          background: rgba(8,16,28,0.85);
          border: 1px solid rgba(0,200,255,0.18);
          border-radius: 10px;
          padding: 8px 12px 8px 34px;
          font-size: 13px;
          color: #e8f4ff;
          outline: none;
          box-sizing: border-box;
          transition: all .2s ease;
        }
        .top-search-wrap input:focus {
          border-color: #00c8ff;
          box-shadow: 0 0 0 3px rgba(0,200,255,0.15), 0 0 16px rgba(0,200,255,0.15);
        }
        .top-search-wrap input::placeholder {
          color: #3d6070;
        }

        .top-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: rgba(0,200,255,0.04);
          border: 1px solid rgba(0,200,255,0.14);
          color: #7ab3cc;
          cursor: pointer;
          transition: all .18s;
        }
        .top-icon-btn:hover {
          color: #00c8ff;
          border-color: #00c8ff;
          background: rgba(0,200,255,0.1);
          box-shadow: 0 0 12px rgba(0,200,255,0.25);
        }
      `}</style>

      {/* ─── Animated Background Glows ─── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "-15%",
            right: "10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,200,255,0.09) 0%, transparent 68%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            left: "10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,230,0,0.05) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* ─── Application Shell Column ─── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          width: "100%",
          position: "relative",
          zIndex: 1,
          background: "#04090f",
        }}
      >
        {/* ════ TOP NAVIGATION BAR ════ */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            height: 70,
            background: "rgba(6, 13, 23, 0.94)",
            borderBottom: "1px solid rgba(0,200,255,0.15)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
            gap: 20,
          }}
        >
          {/* Left: Brand Logo & Navigation Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexShrink: 0 }}>
            {/* Logo */}
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}
              className="group"
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  background: "linear-gradient(135deg, #0070a8 0%, #00c8ff 100%)",
                  boxShadow: "0 0 16px rgba(0,200,255,0.4)",
                  transition: "transform 0.2s ease",
                }}
              >
                {Ico.shield()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: ".08em", color: C.text }}>
                  GUARDIAN <span style={{ color: C.neon }}>AI</span>
                </div>
                <div style={{ fontSize: 9.5, color: C.muted, letterSpacing: ".08em", fontWeight: 700, marginTop: 1 }}>
                  CONTENT VERIFICATION
                </div>
              </div>
            </Link>

            {/* Vertical Divider */}
            <div style={{ width: 1, height: 28, background: "rgba(0,200,255,0.12)" }} />

            {/* Top Workspace Navigation Tabs */}
            <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {NAV_TABS.map((tab) => {
                const isActive = path === tab.href;
                return (
                  <Link
                    key={tab.label}
                    href={tab.href}
                    className={`top-nav-tab ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span style={{ color: isActive ? C.neon : "inherit", opacity: isActive ? 1 : 0.75 }}>
                      {tab.icon()}
                    </span>
                    <span>{tab.label}</span>
                    {tab.href === "/ledger" && staleCount > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: C.high,
                          background: "rgba(255,77,109,0.18)",
                          border: "1px solid rgba(255,77,109,0.45)",
                          borderRadius: 999,
                          padding: "1px 7px",
                          lineHeight: 1.2,
                        }}
                      >
                        {staleCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Search, Live Ledger Stats, Profile & Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Search Box */}
            <div className="top-search-wrap">
              <span
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#3d6070",
                  display: "flex",
                  pointerEvents: "none",
                }}
              >
                {Ico.search()}
              </span>
              <input
                placeholder="Search issues, facts, posts…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Button */}
            <button className="top-icon-btn" aria-label="Filter">
              {Ico.filter()}
            </button>

            {/* Stale Badge Alert if any */}
            {staleCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "rgba(255,77,109,0.12)",
                  border: "1px solid rgba(255,77,109,0.4)",
                  borderRadius: 9,
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.high,
                  boxShadow: "0 0 14px rgba(255,77,109,0.2)",
                  whiteSpace: "nowrap",
                }}
              >
                {Ico.warn()} {staleCount} stale
              </div>
            )}

            {/* Compact Ledger Stats Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "6px 14px",
                borderRadius: 10,
                background: "rgba(0,200,255,0.04)",
                border: "1px solid rgba(0,200,255,0.12)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: C.neon }}>{facts.length}</span>{" "}
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>FACTS</span>
              </div>
              <span style={{ color: "rgba(0,200,255,0.2)" }}>•</span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: C.sub }}>{posts.length}</span>{" "}
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>POSTS</span>
              </div>
              <span style={{ color: "rgba(0,200,255,0.2)" }}>•</span>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: staleCount > 0 ? C.high : C.muted }}>
                  {staleCount}
                </span>{" "}
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>STALE</span>
              </div>
            </div>

            {/* Vertical Divider */}
            <div style={{ width: 1, height: 24, background: "rgba(0,200,255,0.12)" }} />

            {/* Profile Avatar & Info */}
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#fff",
                  background: "linear-gradient(135deg, #0070a8, #00c8ff)",
                  boxShadow: "0 0 10px rgba(0,200,255,0.35)",
                }}
              >
                N
              </div>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Guardian Reviewer</span>
                <span style={{ fontSize: 10, color: C.muted }}>Content Verifier</span>
              </div>
            </div>

            {/* Sign Out / Exit Icon Button */}
            <Link
              href="/"
              className="top-icon-btn"
              title="Sign out & return to home"
              style={{ color: "#ff4d6d", borderColor: "rgba(255,77,109,0.2)" }}
            >
              {Ico.logout()}
            </Link>
          </div>
        </header>

        {/* ════ MAIN WORKSPACE CONTENT ════ */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 40px",
            maxWidth: 1400,
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
        >
          {children}
        </main>
      </div>
    </>
  );
}
