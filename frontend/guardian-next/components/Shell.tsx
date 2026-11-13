"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLedgerStore } from "@/lib/ledger-store";

/* ─── Minimal SVG Icons ─── */
const Ico = {
  analyze: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),

  home: (s = 15) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v12h14V9" />
      <path d="M9 21v-8h6v8" />
    </svg>
  ),

  warn: (s = 13) => (
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
  { href: "/sources", label: "Sources", icon: Ico.search },
  { href: "/admin", label: "Fact Registry", icon: Ico.admin },
  { href: "/ledger", label: "Living Ledger", icon: Ico.ledger },
  { href: "/analytics", label: "Analytics", icon: Ico.analytics },
];

export default function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();

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
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          height: 42px;
          padding: 0 20px;
          border-radius: 999px;
          font-size: 15.5px;
          font-weight: 600;
          color: var(--t2);
          text-decoration: none;
          border: 1px solid var(--line);
          transition: background-color 0.15s var(--ease), border-color 0.15s var(--ease), color 0.15s var(--ease);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .top-nav-tab:hover {
          color: var(--t1);
          border-color: rgba(242, 103, 95, 0.45);
          background: rgba(255, 226, 220, 0.06);
        }

        .top-nav-tab.active {
          color: #ffffff;
          background: var(--blood);
          border-color: var(--blood);
          box-shadow: 0 2px 14px rgba(176, 18, 27, 0.4);
        }

        .top-search-wrap {
          position: relative;
          width: 200px;
          flex-shrink: 0;
        }

        .top-search-wrap input {
          width: 100%;
          background: var(--s1);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 8px 58px 8px 34px;
          font-size: 13px;
          color: var(--t1);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s var(--ease);
          font-family: inherit;
        }

        .top-search-wrap input:focus {
          border-color: var(--blood);
          outline: 2px solid var(--t1);
          outline-offset: 1px;
        }

        .top-search-wrap input::placeholder {
          color: var(--t3);
        }

        .search-results-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 380px;
          max-height: 420px;
          overflow-y: auto;
          background: var(--s1);
          border: 1px solid var(--line);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.85);
          z-index: 100;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .search-item {
          padding: 10px 12px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-decoration: none;
          background: var(--s2);
          border: 1px solid transparent;
          transition: border-color 0.15s var(--ease);
          cursor: pointer;
        }

        .search-item:hover {
          border-color: rgba(242, 103, 95, 0.55);
        }

        .home-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          height: 38px;
          padding: 0 14px;
          border-radius: 999px;
          background: transparent;
          border: 1px solid var(--line);
          color: var(--t2);
          transition: background-color 0.15s var(--ease), border-color 0.15s var(--ease), color 0.15s var(--ease);
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }

        .home-btn:hover {
          color: var(--t1);
          border-color: var(--t3);
          background: rgba(255, 226, 220, 0.05);
        }

        .shell-nav-scroll {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          flex-shrink: 0;
          min-width: 0;
        }

        .shell-nav-scroll::-webkit-scrollbar {
          display: none;
        }

        .shell-main {
          flex: 1;
          overflow-y: auto;
          padding: 36px 28px 80px;
          max-width: 1240px;
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
            gap: 14px !important;
          }

          .shell-header-right {
            gap: 10px !important;
          }

          .shell-stats {
            display: none !important;
          }

          .top-search-wrap {
            width: 180px;
          }

          .shell-main {
            padding: 24px 16px 64px;
          }
        }

        @media (max-width: 760px) {
          .shell-header {
            position: relative !important;
            height: auto !important;
            min-height: 64px;
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
            padding-top: 4px;
          }

          .shell-header-right {
            width: 100%;
            justify-content: space-between;
            flex-wrap: wrap;
            padding-top: 4px;
          }

          .top-search-wrap {
            flex: 1;
            min-width: 140px;
          }

          .search-results-dropdown {
            width: 100%;
            right: 0;
            left: 0;
          }

          .shell-profile {
            display: none !important;
          }
        }
      `}</style>

      {/* ─── Application Shell ─── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          width: "100%",
          position: "relative",
          zIndex: 1,
          background: "var(--ink)",
          color: "var(--t1)",
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
            height: 64,
            background: "rgba(15, 7, 8, 0.88)",
            borderBottom: "1px solid var(--line)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
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
            {/* Logo matching Home page Navbar */}
            <Link
              href="/"
              aria-label="Guardian AI"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 18,
                color: "var(--t1)",
                flexShrink: 0,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B"/>
                <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" stroke="#F2675F" strokeWidth="0.5" fill="none" opacity="0.4"/>
                <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Guardian<span style={{ color: "var(--blood)", fontWeight: 400 }}> AI</span></span>
            </Link>

            {/* Divider */}
            <div
              className="shell-header-divider"
              style={{
                width: 1,
                height: 24,
                background: "var(--line)",
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
                        display: "flex",
                        alignItems: "center",
                        opacity: isActive ? 1 : 0.8,
                      }}
                    >
                      {tab.icon()}
                    </span>

                    <span>{tab.label}</span>

                    {tab.href === "/ledger" && staleCount > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#fff",
                          background: "var(--blood)",
                          borderRadius: 999,
                          padding: "1px 7px",
                          lineHeight: 1.2,
                          fontFamily: "var(--mono)",
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
              gap: 12,
              flexShrink: 0,
            }}
          >
            {/* Search Box with Live Results Dropdown */}
            <div className="top-search-wrap" ref={searchWrapRef}>
              <span
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--t3)",
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
                placeholder="Search (Ctrl+K)..."
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
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 10.5,
                  fontFamily: "var(--mono)",
                  color: "var(--t3)",
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--line)",
                  pointerEvents: "none",
                }}
              >
                Ctrl+K
              </span>

              {/* Live Search Dropdown */}
              {searchOpen && q && (
                <div className="search-results-dropdown">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "6px 8px 8px",
                      borderBottom: "1px solid var(--line)",
                      fontSize: 11,
                      color: "var(--t3)",
                      fontFamily: "var(--mono)",
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
                        color: "var(--t3)",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Esc
                    </button>
                  </div>

                  {totalResults === 0 ? (
                    <div style={{ padding: "16px 10px", textAlign: "center", fontSize: 13, color: "var(--t3)" }}>
                      No matches found in facts, posts, or findings.
                    </div>
                  ) : (
                    <>
                      {/* Facts Matches */}
                      {matchedFacts.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--redhi)", letterSpacing: ".06em", padding: "4px 8px", textTransform: "uppercase", fontFamily: "var(--mono)" }}>
                            Facts ({matchedFacts.length})
                          </div>
                          {matchedFacts.map((f) => (
                            <Link
                              key={f.id}
                              href="/admin"
                              className="search-item"
                              onClick={() => setSearchOpen(false)}
                            >
                              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)", display: "flex", justifyContent: "space-between" }}>
                                <span>{f.label}</span>
                                <span style={{ color: "var(--redhi)", fontFamily: "var(--mono)" }}>${f.value}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--mono)" }}>
                                ID: {f.id} · v{f.version}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Posts Matches */}
                      {matchedPosts.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--yellow)", letterSpacing: ".06em", padding: "4px 8px", textTransform: "uppercase", fontFamily: "var(--mono)" }}>
                            Posts ({matchedPosts.length})
                          </div>
                          {matchedPosts.map((p) => (
                            <Link
                              key={p.id}
                              href="/ledger"
                              className="search-item"
                              onClick={() => setSearchOpen(false)}
                            >
                              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--t1)", display: "flex", justifyContent: "space-between" }}>
                                <span>{p.title}</span>
                                <span style={{ fontSize: 11, color: p.status === "stale" ? "var(--yellow)" : "#10b981", fontFamily: "var(--mono)" }}>
                                  {p.status}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: "var(--t2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {p.text}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Findings Matches */}
                      {matchedIssues.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--redhi)", letterSpacing: ".06em", padding: "4px 8px", textTransform: "uppercase", fontFamily: "var(--mono)" }}>
                            Findings ({matchedIssues.length})
                          </div>
                          {matchedIssues.map((i) => (
                            <Link
                              key={i.id}
                              href="/review"
                              className="search-item"
                              onClick={() => setSearchOpen(false)}
                            >
                              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--t1)" }}>
                                &ldquo;{i.flagged_text}&rdquo;
                              </div>
                              <div style={{ fontSize: 11, color: "var(--t2)" }}>
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

            {/* Stale Alert (compact) */}
            {staleCount > 0 && (
              <Link
                href="/ledger"
                className="shell-stale-alert"
                role="status"
                title={`${staleCount} stale posts require attention`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 36,
                  padding: "0 10px",
                  background: "rgba(242, 103, 95, 0.12)",
                  border: "1px solid var(--redhi)",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--redhi)",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  fontFamily: "var(--mono)",
                  flexShrink: 0,
                }}
              >
                {Ico.warn(12)}
                {staleCount} stale
              </Link>
            )}

            {/* User Profile + Logout (Clean & Compact) */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  height: 36,
                  padding: "0 12px",
                  borderRadius: 999,
                  background: "var(--s1)",
                  border: "1px solid var(--line)",
                  fontSize: 12.5,
                  color: "var(--t1)",
                  fontFamily: "var(--mono)",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #8c0e15, #b0121b)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  U
                </span>
                <span>Team</span>
              </div>

              <button
                type="button"
                title="Sign out"
                onClick={() => {
                  localStorage.removeItem("guardian_token");
                  window.location.href = "/login";
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 36,
                  width: 36,
                  borderRadius: 999,
                  background: "transparent",
                  border: "1px solid var(--line)",
                  color: "var(--t3)",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--redhi)";
                  e.currentTarget.style.color = "var(--redhi)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.color = "var(--t3)";
                }}
                aria-label="Sign out"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
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
