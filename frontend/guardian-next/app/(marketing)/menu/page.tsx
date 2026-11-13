"use client";

import Link from "next/link";

export default function MenuPage() {
  const sections = [
    {
      title: "Core Workspaces",
      tag: "WORKSPACE",
      color: "var(--blood)",
      links: [
        {
          href: "/analyze",
          name: "Analyze Draft Copy",
          desc: "Run instant deterministic rule checks and extract claims for AI retrieval verification.",
          badge: "Pipeline",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          ),
        },
        {
          href: "/review",
          name: "Review Session & Citations",
          desc: "Interactive proof sheet with claim-by-claim citations, confidence meter, and one-click fixes.",
          badge: "Human-in-Loop",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5l8-3z" />
            </svg>
          ),
        },
        {
          href: "/sources",
          name: "Sources & Documents",
          desc: "Search, inspect, and upload approved brand policies, pricing sheets, and benchmark claims.",
          badge: "Knowledge Base",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          ),
        },
        {
          href: "/admin",
          name: "Fact Registry",
          desc: "Maintain atomic truth values. Update pricing and SLA facts with instant downstream drift alerts.",
          badge: "Source of Truth",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
            </svg>
          ),
        },
        {
          href: "/ledger",
          name: "Living Claim Ledger",
          desc: "Audit trail and post inventory. Highlights pricing drift and stale statements instantly.",
          badge: "Living Ledger",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          ),
        },
        {
          href: "/analytics",
          name: "Analytics & Metrics",
          desc: "Monitor deterministic check throughput, severity distribution, and reviewer accept rates.",
          badge: "Telemetry",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          ),
        },
        {
          href: "/login",
          name: "Team Login",
          desc: "Sign in to your team workspace to verify drafts, manage facts, and inspect evidence.",
          badge: "Team Access",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
            </svg>
          ),
        },
        {
          href: "/register",
          name: "Register Account",
          desc: "Create a new team account or get instant test access to explore the complete platform.",
          badge: "New User",
          badgeColor: "#10b981",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "System & Architecture",
      tag: "OVERVIEW",
      color: "var(--blood)",
      links: [
        {
          href: "/#what",
          name: "System Capabilities",
          desc: "Pre-publish deterministic filter, citation verification gate, and living claim ledger.",
          badge: "Offerings",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          ),
        },
        {
          href: "/#faq",
          name: "Documentation & FAQ",
          desc: "Clear explanations on verification logic, deterministic constraints, and audit logs.",
          badge: "Help",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        color: "var(--t1)",
        padding: "48px 24px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle deep red ambient glow behind content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: "20%",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(176,18,27,0.12) 0%, rgba(58,8,12,0.04) 60%, transparent 80%)",
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "15%",
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(58,8,12,0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: 48 }}>
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--line)",
            paddingBottom: 24,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B" />
              <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" stroke="#F2675F" strokeWidth="0.5" fill="none" opacity="0.4" />
              <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--t1)" }}>
                Guardian<span style={{ color: "var(--blood)", fontWeight: 400 }}> AI</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--t3)", fontFamily: "var(--mono)", letterSpacing: "0.1em" }}>
                NAVIGATION DIRECTORY
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="pill ghost"
            style={{
              height: 38,
              padding: "0 18px",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--mono)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Home
          </Link>
        </div>

        {/* Hero Title */}
        <div>
          <span style={{ fontSize: 12, textTransform: "uppercase", fontFamily: "var(--mono)", letterSpacing: "0.14em", color: "var(--redhi)", fontWeight: 600 }}>
            Application Index &amp; Shortcuts
          </span>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--t1)", margin: "8px 0 10px" }}>
            Platform Menu
          </h1>
          <p style={{ color: "var(--t2)", fontSize: 16.5, margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
            Direct access to all verification interfaces, fact management registries, and living claim audit records.
          </p>
        </div>

        {/* Section Groups */}
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {sections.map((sec) => (
            <div key={sec.title} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--mono)",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "var(--redhi)",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: "rgba(176,18,27,0.15)",
                    border: "1px solid rgba(176,18,27,0.35)",
                  }}
                >
                  {sec.tag}
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--t1)", margin: 0 }}>
                  {sec.title}
                </h2>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 }}>
                {sec.links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    style={{
                      background: "var(--s1)",
                      border: "1px solid var(--line)",
                      borderRadius: 20,
                      padding: 24,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 20,
                      textDecoration: "none",
                      transition: "border-color 0.2s var(--ease), transform 0.2s var(--ease), box-shadow 0.2s var(--ease)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "rgba(242, 103, 95, 0.55)";
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.boxShadow = "0 12px 32px rgba(176, 18, 27, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--line)";
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: "var(--s2)",
                          border: "1px solid var(--line)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--redhi)",
                        }}
                      >
                        {link.icon}
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "3px 10px",
                          borderRadius: 999,
                          fontFamily: "var(--mono)",
                          fontWeight: 600,
                          backgroundColor: link.badgeColor ? `${link.badgeColor}20` : "rgba(176,18,27,0.15)",
                          borderColor: link.badgeColor ? `${link.badgeColor}40` : "rgba(176,18,27,0.35)",
                          color: link.badgeColor || "var(--redhi)",
                          borderWidth: 1,
                          borderStyle: "solid",
                        }}
                      >
                        {link.badge}
                      </span>
                    </div>

                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--t1)", margin: "0 0 6px" }}>
                        {link.name}
                      </h3>
                      <p style={{ fontSize: 14, color: "var(--t2)", margin: 0, lineHeight: 1.6 }}>
                        {link.desc}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Launch CTA Banner */}
        <div
          style={{
            padding: 32,
            borderRadius: 20,
            background: "var(--s1)",
            border: "1px solid rgba(176,18,27,0.35)",
            boxShadow: "0 0 40px rgba(176,18,27,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--t1)", margin: "0 0 6px" }}>
              Ready to verify marketing copy?
            </h3>
            <p style={{ fontSize: 14.5, color: "var(--t2)", margin: 0 }}>
              Start with sample draft copy to experience deterministic rule checks and evidence verifications.
            </p>
          </div>
          <div>
            <Link href="/analyze" className="pill red" style={{ height: 42, padding: "0 22px", fontSize: 14 }}>
              Start Instant Test →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
