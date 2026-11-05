"use client";
import Link from "next/link";
import { useLedger } from "@/lib/ledger-store";

export default function MenuPage() {
  const { facts, posts, staleCount } = useLedger();

  const sections = [
    {
      title: "Core Workspaces",
      tag: "WORKSPACE",
      color: "#00c8ff",
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
          )
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
          )
        },
        {
          href: "/admin",
          name: "Fact Registry",
          desc: "Single source of truth for pricing, claims, and policies. Editing a fact propagates to linked posts.",
          badge: `${facts.length} Facts Active`,
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
            </svg>
          )
        },
        {
          href: "/ledger",
          name: "Living Claim Ledger",
          desc: "Audit trail and post inventory. Highlights pricing drift and stale statements instantly.",
          badge: staleCount > 0 ? `${staleCount} Stale` : "In Sync",
          badgeColor: staleCount > 0 ? "#ff4d6d" : "#00e5a0",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          )
        }
      ]
    },
    {
      title: "System & Architecture",
      tag: "OVERVIEW",
      color: "#ffe600",
      links: [
        {
          href: "/#product",
          name: "System Capabilities",
          desc: "Pre-publish deterministic filter, citation verification gate, and living claim ledger.",
          badge: "Offerings",
          icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )
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
          )
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#04090f] text-[#e8f4ff] px-6 py-12 md:py-20 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#00c8ff]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#ffe600]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 flex flex-col gap-12">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#00c8ff]/15 pb-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0070a8] to-[#00c8ff] flex items-center justify-center font-bold text-lg text-white shadow-[0_0_20px_rgba(0,200,255,0.4)] group-hover:scale-105 transition-transform">
              G
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wider">
                GUARDIAN <span className="text-[#00c8ff]">AI</span>
              </div>
              <div className="text-[10px] text-[#7ab3cc] tracking-widest font-mono">
                NAVIGATION DIRECTORY
              </div>
            </div>
          </Link>

          <Link
            href="/"
            className="btn text-xs font-semibold px-4 py-2 h-auto flex items-center gap-2 border border-[#00c8ff]/30 text-[#00c8ff] hover:bg-[#00c8ff]/10"
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
          <span className="text-xs uppercase font-mono tracking-widest text-[#ffe600] font-bold">
            Application Index & Shortcuts
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#e8f4ff] mt-2 font-[family-name:var(--font-display)]">
            Platform Menu
          </h1>
          <p className="text-[#7ab3cc] text-base mt-2 max-w-xl">
            Direct access to all verification interfaces, fact management registries, and living claim audit records.
          </p>
        </div>

        {/* Section Groups */}
        <div className="flex flex-col gap-10">
          {sections.map((sec) => (
            <div key={sec.title} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold tracking-widest text-[#00c8ff] uppercase px-2.5 py-0.5 rounded bg-[#00c8ff]/10 border border-[#00c8ff]/25">
                  {sec.tag}
                </span>
                <h2 className="text-xl font-bold text-[#e8f4ff]">{sec.title}</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {sec.links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="panel p-6 flex flex-col justify-between gap-5 border border-[#00c8ff]/15 hover:border-[#00c8ff] hover:shadow-[0_12px_40px_rgba(0,200,255,0.15)] group transition-all duration-200 rounded-2xl bg-[#080f1a]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#0d1826] border border-[#00c8ff]/20 flex items-center justify-center text-[#00c8ff] group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(0,200,255,0.4)] transition-all">
                        {link.icon}
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-mono font-semibold"
                        style={{
                          backgroundColor: link.badgeColor ? `${link.badgeColor}15` : "rgba(0,200,255,0.1)",
                          borderColor: link.badgeColor ? `${link.badgeColor}40` : "rgba(0,200,255,0.25)",
                          color: link.badgeColor || "#00c8ff",
                          borderWidth: 1,
                        }}
                      >
                        {link.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#e8f4ff] group-hover:text-[#00c8ff] transition-colors flex items-center gap-2">
                        {link.name}
                        <span className="text-xs text-[#00c8ff] opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </h3>
                      <p className="text-sm text-[#7ab3cc] mt-1.5 leading-relaxed">
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
        <div className="p-8 rounded-2xl bg-gradient-to-r from-[#0070a8]/20 via-[#080f1a] to-[#ffe600]/10 border border-[#00c8ff]/30 flex flex-wrap items-center justify-between gap-6 shadow-[0_0_50px_rgba(0,200,255,0.1)]">
          <div>
            <h3 className="text-xl font-bold text-[#e8f4ff]">Ready to verify marketing copy?</h3>
            <p className="text-sm text-[#7ab3cc] mt-1">
              Start with sample draft copy to experience deterministic rule checks and evidence verifications.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/analyze"
              className="btn btn-primary px-6 py-2.5 h-auto text-sm font-bold shadow-[0_0_20px_rgba(0,200,255,0.4)]"
            >
              Open Analyze Studio →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
