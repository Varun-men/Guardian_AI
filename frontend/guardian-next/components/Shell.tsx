"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLedgerStore } from "@/lib/ledger-store";

/* ─── Tokens ─── */
const C = {
  neon: "#ff6b00",
  yellow: "#ff9500",
  blue: "#d44a00",
  text: "#ffffff",
  sub: "#a1a1aa",
  muted: "#71717a",
  border: "rgba(255,107,0,0.2)",
  high: "#ef4444",
  ok: "#10b981",
};

/* ─── Page Titles ─── */
const PAGE_LABELS: Record<string, string> = {
  "/": "Review Session",
  "/review": "Review Session",
  "/analyze": "Analyze Draft",
  "/admin": "Fact Registry",
  "/ledger": "Living Ledger",
  "/analytics": "Analytics & Metrics",
};

/* ─── Minimal SVG Icons ─── */
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

  analytics: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),

  search: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),

  home: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v12h14V9" />
      <path d="M9 21v-8h6v8" />
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

/* ─── Navigation ─── */
const NAV_TABS = [
  { href: "/analyze", label: "Analyze", icon: Ico.analyze },
  { href: "/review", label: "Review", icon: Ico.review },
  { href: "/admin", label: "Fact Registry", icon: Ico.admin },
  { href: "/ledger", label: "Ledger", icon: Ico.ledger },
  { href: "/analytics", label: "Analytics", icon: Ico.analytics },
];

export default function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();

  const { facts, posts, staleCount, analysis } = useLedgerStore();

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside search wrap to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search filtering across Facts, Posts, and Analysis Issues
  const q = search.trim().toLowerCase();
  const matchedFacts = q
    ? facts.filter(
        (f) =>
          f.label.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q) ||
          String(f.value).includes(q)
      )
    : [];
  const matchedPosts = q
    ? posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.text.toLowerCase().includes(q) ||
          p.token.toLowerCase().includes(q)
      )
    : [];
  const matchedIssues = q
    ? (analysis?.issues ?? []).filter(
        (i) =>
          i.flagged_text.toLowerCase().includes(q) ||
          i.explanation.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q)
      )
    : [];

  const totalResults = matchedFacts.length + matchedPosts.length + matchedIssues.length;

  return (
    <>
      <style>{`
        .top-nav-tab {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 13px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: #a1a1aa;
          text-decoration: none;
          border: 1px solid transparent;
          transition: all .2s cubic-bezier(0.16,1,0.3,1);
          white-space: nowrap;
        }

        .top-nav-tab:hover {
          color: #ffffff;
          background: rgba(255,107,0,0.08);
          border-color: rgba(255,107,0,0.25);
        }

        .top-nav-tab.active {
          color: #ff6b00;
          background: linear-gradient(
            135deg,
            rgba(255,107,0,0.18),
            rgba(255,107,0,0.06)
          );
          border-color: #ff6b00;
          box-shadow: 0 0 16px rgba(255,107,0,0.2);
        }

        .top-search-wrap {
          position: relative;
          width: 260px;
          flex-shrink: 1;
          min-width: 160px;
        }

        .top-search-wrap input {
          width: 100%;
          background: rgba(16,16,18,0.95);
          border: 1px solid rgba(255,107,0,0.22);
          border-radius: 10px;
          padding: 9px 48px 9px 36px;
          font-size: 13px;
          color: #ffffff;
          outline: none;
          box-sizing: border-box;
          transition: all .2s ease;
        }

        .top-search-wrap input:focus {
          border-color: #ff6b00;
          box-shadow: 0 0 0 3px rgba(255,107,0,0.18);
        }

        .top-search-wrap input::placeholder {
          color: #71717a;
        }

        .search-results-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 380px;
          max-height: 440px;
          overflow-y: auto;
          background: #0d0d10;
          border: 1px solid rgba(255,107,0,0.25);
          border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,107,0,0.15);
          z-index: 100;
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .search-item {
          padding: 9px 12px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-decoration: none;
          background: rgba(255,255,255,0.02);
          border: 1px solid transparent;
          transition: all .15s ease;
          cursor: pointer;
        }

        .search-item:hover {
          background: rgba(255,107,0,0.1);
          border-color: rgba(255,107,0,0.3);
        }

        .home-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-width: 36px;
          height: 36px;
          padding: 0 10px;
          border-radius: 9px;
          background: rgba(255,107,0,0.06);
          border: 1px solid rgba(255,107,0,0.2);
          color: #ff6b00;
          transition: all .18s;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .home-btn:hover {
          background: rgba(255,107,0,0.14);
          border-color: #ff6b00;
        }

        .shell-nav-scroll {
          display: flex;
          align-items: center;
          gap: 5px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .shell-nav-scroll::-webkit-scrollbar {
          display: none;
        }

        .shell-main {
          flex: 1;
          overflow-y: auto;
          padding: 32px 40px;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }

        @media (max-width: 1100px) {
          .shell-header {
            padding: 0 16px !important;
            gap: 12px !important;
          }

          .shell-header-left {
            gap: 12px !important;
          }

          .shell-header-right {
            gap: 9px !important;
          }

          .shell-stats {
            display: none !important;
          }

          .top-search-wrap {
            width: 180px;
          }

          .shell-main {
            padding: 26px 22px;
          }
        }

        @media (max-width: 760px) {
          .shell-header {
            position: relative !important;
            height: auto !important;
            min-height: 65px;
            padding: 12px 16px !important;
            flex-wrap: wrap;
          }

          .shell-header-left {
            width: 100%;
            flex-wrap: wrap;
          }

          .shell-header-divider {
            display: none !important;
          }

          .shell-nav-scroll {
            width: 100%;
          }

          .shell-header-right {
            width: 100%;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .top-search-wrap {
            flex: 1;
            min-width: 150px;
          }

          .search-results-dropdown {
            width: 100%;
            right: 0;
            left: 0;
          }

          .shell-profile {
            display: none !important;
          }

          .shell-main {
            padding: 22px 15px;
          }
        }

        @media (max-width: 420px) {
          .top-nav-tab {
            padding: 8px 10px;
            font-size: 12px;
          }

          .shell-stale-alert {
            font-size: 10px !important;
            padding: 5px 8px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .top-nav-tab,
          .home-btn,
          .top-search-wrap input {
            transition: none !important;
          }
        }
      `}</style>

      {/* ─── Background Glows ─── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-15%",
            right: "10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,107,0,0.10) 0%, transparent 68%)",
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
            background:
              "radial-gradient(circle, rgba(255,149,0,0.06) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* ─── Application Shell ─── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          width: "100%",
          position: "relative",
          zIndex: 1,
          background: "#000000",
        }}
      >
        {/* ─── Header ─── */}
        <header
          className="shell-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            minHeight: 70,
            background: "rgba(10,10,12,0.96)",
            borderBottom: "1px solid rgba(255,107,0,0.18)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 4px 30px rgba(0,0,0,0.6)",
            gap: 20,
          }}
        >
          {/* Left: Brand and Navigation */}
          <div
            className="shell-header-left"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              minWidth: 0,
              flexShrink: 1,
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              aria-label="Guardian AI home"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                textDecoration: "none",
                flexShrink: 0,
              }}
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
                  background:
                    "linear-gradient(135deg,#d44a00 0%,#ff6b00 100%)",
                  boxShadow: "0 0 16px rgba(255,107,0,0.45)",
                }}
              >
                {Ico.shield()}
              </div>

              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    color: C.text,
                  }}
                >
                  GUARDIAN <span style={{ color: C.neon }}>AI</span>
                </div>

                <div
                  style={{
                    fontSize: 9.5,
                    color: C.muted,
                    letterSpacing: ".08em",
                    fontWeight: 700,
                    marginTop: 1,
                  }}
                >
                  CONTENT VERIFICATION
                </div>
              </div>
            </Link>

            {/* Divider */}
            <div
              className="shell-header-divider"
              style={{
                width: 1,
                height: 28,
                background: "rgba(255,107,0,0.18)",
                flexShrink: 0,
              }}
            />

            {/* Navigation Tabs */}
            <nav
              className="shell-nav-scroll"
              aria-label="Main navigation"
            >
              {NAV_TABS.map((tab) => {
                const isActive =
                  path === tab.href ||
                  path.startsWith(`${tab.href}/`);

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`top-nav-tab ${isActive ? "active" : ""}`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span
                      style={{
                        color: isActive ? C.neon : "inherit",
                        opacity: isActive ? 1 : 0.75,
                        display: "flex",
                      }}
                    >
                      {tab.icon()}
                    </span>

                    <span>{tab.label}</span>

                    {tab.href === "/ledger" && staleCount > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: C.high,
                          background: "rgba(239,68,68,0.18)",
                          border: "1px solid rgba(239,68,68,0.45)",
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

          {/* Right: Search, Stats, and Actions */}
          <div
            className="shell-header-right"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexShrink: 0,
            }}
          >
            {/* Search Box with Live Results Dropdown */}
            <div className="top-search-wrap" ref={searchWrapRef}>
              <span
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.muted,
                  display: "flex",
                  pointerEvents: "none",
                }}
              >
                {Ico.search()}
              </span>

              <input
                ref={searchInputRef}
                type="search"
                aria-label="Search workspace"
                placeholder="Search (⌘K)..."
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchOpen(true);
                }}
              />

              <span
                style={{
                  position: "absolute",
                  right: 9,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 10,
                  fontFamily: "ui-monospace,monospace",
                  color: C.muted,
                  padding: "1px 5px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  pointerEvents: "none",
                }}
              >
                ⌘K
              </span>

              {/* Live Search Dropdown */}
              {searchOpen && q && (
                <div className="search-results-dropdown">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 8px 6px",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      fontSize: 11,
                      color: C.muted,
                    }}
                  >
                    <span>
                      {totalResults} result{totalResults === 1 ? "" : "s"} for &ldquo;{search}&rdquo;
                    </span>
                    <button
                      type="button"
                      onClick={() => setSearchOpen(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: C.muted,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Esc to close
                    </button>
                  </div>

                  {totalResults === 0 ? (
                    <div style={{ padding: "20px 12px", textAlign: "center", fontSize: 13, color: C.muted }}>
                      No matches found in facts, posts, or findings.
                    </div>
                  ) : (
                    <>
                      {/* Facts Matches */}
                      {matchedFacts.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: C.neon, letterSpacing: ".08em", padding: "4px 8px", textTransform: "uppercase" }}>
                            Facts ({matchedFacts.length})
                          </div>
                          {matchedFacts.map((f) => (
                            <Link
                              key={f.id}
                              href="/admin"
                              className="search-item"
                              onClick={() => setSearchOpen(false)}
                            >
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", justifyContent: "space-between" }}>
                                <span>{f.label}</span>
                                <span style={{ color: C.neon }}>${f.value}</span>
                              </div>
                              <div style={{ fontSize: 11, color: C.muted, fontFamily: "monospace" }}>
                                ID: {f.id} · v{f.version}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Posts Matches */}
                      {matchedPosts.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: C.yellow, letterSpacing: ".08em", padding: "4px 8px", textTransform: "uppercase" }}>
                            Posts ({matchedPosts.length})
                          </div>
                          {matchedPosts.map((p) => (
                            <Link
                              key={p.id}
                              href="/ledger"
                              className="search-item"
                              onClick={() => setSearchOpen(false)}
                            >
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", justifyContent: "space-between" }}>
                                <span>{p.title}</span>
                                <span style={{ fontSize: 11, color: p.status === "stale" ? C.high : C.ok }}>
                                  {p.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 11.5, color: C.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {p.text}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Findings Matches */}
                      {matchedIssues.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", letterSpacing: ".08em", padding: "4px 8px", textTransform: "uppercase" }}>
                            Findings ({matchedIssues.length})
                          </div>
                          {matchedIssues.map((i) => (
                            <Link
                              key={i.id}
                              href="/review"
                              className="search-item"
                              onClick={() => setSearchOpen(false)}
                            >
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff" }}>
                                &ldquo;{i.flagged_text}&rdquo;
                              </div>
                              <div style={{ fontSize: 11, color: C.sub }}>
                                {i.explanation}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Stale Alert */}
            {staleCount > 0 && (
              <Link
                href="/ledger"
                className="shell-stale-alert"
                role="status"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  borderRadius: 9,
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.high,
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                }}
              >
                {Ico.warn()}
                {staleCount} stale
              </Link>
            )}

            {/* Ledger Statistics */}
            <div
              className="shell-stats"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "6px 14px",
                borderRadius: 10,
                background: "rgba(255,107,0,0.06)",
                border: "1px solid rgba(255,107,0,0.18)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: C.neon }}>
                  {facts.length}
                </span>{" "}
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>
                  FACTS
                </span>
              </div>

              <span style={{ color: "rgba(255,107,0,0.25)" }}>•</span>

              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: C.sub }}>
                  {posts.length}
                </span>{" "}
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>
                  POSTS
                </span>
              </div>

              <span style={{ color: "rgba(255,107,0,0.25)" }}>•</span>

              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    color: staleCount > 0 ? C.high : C.muted,
                  }}
                >
                  {staleCount}
                </span>{" "}
                <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>
                  STALE
                </span>
              </div>
            </div>

            {/* Divider */}
            <div
              className="shell-header-divider"
              style={{
                width: 1,
                height: 24,
                background: "rgba(255,107,0,0.18)",
              }}
            />

            {/* Profile */}
            <div
              className="shell-profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
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
                  background: "linear-gradient(135deg,#d44a00,#ff6b00)",
                  boxShadow: "0 0 10px rgba(255,107,0,0.4)",
                }}
              >
                G
              </div>

              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                  Guardian Reviewer
                </span>

                <span style={{ fontSize: 10, color: C.muted }}>
                  Content Verifier
                </span>
              </div>
            </div>

            {/* Home Navigation */}
            <Link
              href="/"
              className="home-btn"
              title="Return to home"
              aria-label="Return to home"
            >
              {Ico.home()}
              <span className="shell-profile">Home</span>
            </Link>
          </div>
        </header>

        {/* ─── Main Content ─── */}
        <main className="shell-main">
          {children}
        </main>
      </div>
    </>
  );
}
