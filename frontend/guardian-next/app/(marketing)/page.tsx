"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ─── Colour tokens ─── */
const C = {
  neon: "#ff6b00",
  yellow: "#ff9500",
  text: "#ffffff",
  text2: "#a1a1aa",
  muted: "#71717a",
  bg: "#000000",
  surface: "#0c0c0e",
  raised: "#17171a",
  line: "rgba(255,107,0,.18)",
  high: "#ef4444",
  ok: "#10b981",
};

/* ─── Scroll-reveal hook for elements popping up from bottom ─── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          ob.disconnect();
        }
      },
      { threshold }
    );
    ob.observe(ref.current);
    return () => ob.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─── Reveal wrapper ─── */
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(55px) scale(0.98)",
        transition: `opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── OFFERINGS ─── */
const OFFERS = [
  {
    title: "Pre-publish review",
    desc: "Deterministic checks catch banned terms, competitor names and missing alt text in milliseconds, before any model is involved.",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
        <circle cx="22" cy="22" r="20" stroke={C.neon} strokeWidth="2" strokeDasharray="5 4" />
        <path d="M14 22h16M22 14v16" stroke={C.neon} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="22" cy="22" r="5" fill={C.neon} fillOpacity=".3" stroke={C.neon} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: "Citation gate",
    desc: "Every AI finding quotes a source passage. Code confirms the quote exists, and anything unverified is marked as needing human judgement.",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
        <rect x="7" y="9" width="30" height="26" rx="5" stroke={C.yellow} strokeWidth="2" />
        <path d="M7 18h30" stroke={C.yellow} strokeWidth="2" />
        <path d="M16 18v17M16 27h14" stroke={C.yellow} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Living ledger",
    desc: "Approved claims stay linked to the facts behind them. When a fact changes, every linked post is flagged for review automatically.",
    icon: (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden>
        <path d="M22 5l15 5.5V22c0 9.5-6.5 16.8-15 20-8.5-3.2-15-10.5-15-20V10.5L22 5z" stroke={C.ok} strokeWidth="2" />
        <path d="M16 22l4.5 4.5 8.5-9" stroke={C.ok} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const FAQ = [
  ["What does Guardian check?", "Drafts are checked against your brand guidelines, claims policy and pricing sheet, with deterministic rules for banned terms, competitor names and image alt text."],
  ["What happens when a fact changes?", "Posts linked to that fact are marked stale in the ledger, and a reviewer can apply the update in one click. The change is written to the audit log."],
  ["Does the AI decide what gets published?", "No. Guardian flags and suggests. A reviewer approves every change, and each decision is recorded with who made it and when."],
];

/* ─── Logo ─── */
function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm" ? 34 : 40;
  const fs = size === "sm" ? 11 : 13;
  return (
    <Link href="/" className="flex items-center gap-3 group" aria-label="Guardian AI home">
      <span
        style={{
          width: s,
          height: s,
          borderRadius: 12,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(135deg, #d44a00, ${C.neon})`,
          boxShadow: `0 0 20px rgba(255,107,0,.45)`,
          fontWeight: 900,
          fontSize: s * 0.45,
          color: "#fff",
          fontFamily: "var(--font-display)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        className="group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(255,107,0,0.6)]"
      >
        G
      </span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span style={{ fontSize: fs + 1, fontWeight: 800, letterSpacing: ".08em", color: C.text }}>
          GUARDIAN <span style={{ color: C.neon }}>AI</span>
        </span>
        <span style={{ fontSize: fs - 2.5, color: C.muted, letterSpacing: ".08em", fontWeight: 700 }}>
          LIVING CLAIM LEDGER
        </span>
      </span>
    </Link>
  );
}

/* ─── Bigger, Bolder Vertical Wave Lines ─── */
function Wave() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 150);
    return () => clearTimeout(t);
  }, []);

  const layers = [
    { base: 260, amp: 85, ph: 0,   op: 0.95, dash: undefined, col: C.neon,   width: 2.2 },
    { base: 220, amp: 70, ph: 0.8, op: 0.65, dash: "5 7",     col: C.neon,   width: 2.0 },
    { base: 170, amp: 55, ph: 1.6, op: 0.45, dash: "3 9",     col: C.yellow, width: 2.2 },
  ];

  const lines: React.ReactNode[] = [];
  layers.forEach((l, li) => {
    for (let x = 3; x < 1200; x += 8) {
      const y = l.base - l.amp * Math.sin(x / 100 + l.ph) - 18 * Math.sin(x / 34 + l.ph);
      lines.push(
        <line
          key={`${li}-${x}`}
          x1={x}
          x2={x}
          y1={loaded ? y : 380}
          y2={380}
          strokeDasharray={l.dash}
          opacity={l.op}
          stroke={l.col}
          strokeWidth={l.width}
          style={{
            transition: `y1 1.4s cubic-bezier(0.16, 1, 0.3, 1) ${(x / 1200) * 400 + li * 150}ms`,
          }}
        />
      );
    }
  });

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
      <svg
        viewBox="0 0 1200 380"
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: 380, display: "block" }}
        vectorEffect="non-scaling-stroke"
        aria-hidden
      >
        {lines}
      </svg>
      {/* Bottom fade line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 40,
          background: "linear-gradient(to top, #000000, transparent)",
        }}
      />
    </div>
  );
}

/* ─── ENHANCED NAV MENU DROPDOWN / QUICK ACCESS ─── */
function NavMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 18px",
          borderRadius: 10,
          cursor: "pointer",
          background: open ? `rgba(255,107,0,.15)` : `rgba(255,107,0,.05)`,
          border: `1px solid ${open ? C.neon : "rgba(255,107,0,0.2)"}`,
          color: open ? C.neon : C.text,
          fontSize: 14,
          fontWeight: 700,
          transition: "all .2s ease",
          boxShadow: open ? "0 0 16px rgba(255,107,0,0.25)" : "none",
        }}
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
        Menu
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 12px)",
            zIndex: 60,
            background: "#0c0c0e",
            border: `1px solid ${C.line}`,
            borderRadius: 16,
            padding: 10,
            minWidth: 260,
            boxShadow: `0 24px 60px rgba(0,0,0,.8), 0 0 0 1px rgba(255,107,0,.15)`,
            animation: "revealUp .22s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div style={{ padding: "8px 12px 6px", fontSize: 10, fontWeight: 800, letterSpacing: ".1em", color: C.muted, textTransform: "uppercase" }}>
            Navigation Directory
          </div>
          {[
            { href: "/menu", label: "Full Platform Menu", icon: "☰", highlight: true },
            { href: "/demo", label: "Explore Interactive Demo", icon: "⚡", isLink: true },
            { href: "/demo", label: "Sample Review", icon: "🛡️", isLink: true },
            { href: "/login", label: "Team Login", icon: "⚙️", isLink: true },
            { href: "/demo", label: "Sample Ledger", icon: "📒", isLink: true },
            { href: "#product", label: "Our Offerings", icon: "◈" },
            { href: "#faq", label: "FAQ & Help", icon: "?" },
          ].map((item) => {
            const Tag = item.isLink || item.href === "/menu" ? Link : "a";
            return (
              <Tag
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: item.highlight ? C.yellow : C.text,
                  background: item.highlight ? `rgba(255,149,0,.08)` : "transparent",
                  textDecoration: "none",
                  transition: "background .15s, color .15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = item.highlight ? `rgba(255,149,0,.15)` : `rgba(255,107,0,.08)`;
                  (e.currentTarget as HTMLElement).style.color = item.highlight ? C.yellow : C.neon;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = item.highlight ? `rgba(255,149,0,.08)` : "transparent";
                  (e.currentTarget as HTMLElement).style.color = item.highlight ? C.yellow : C.text;
                }}
              >
                <span style={{ width: 20, textAlign: "center", fontSize: 14 }}>{item.icon}</span>
                {item.label}
              </Tag>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Hero animated text hook (slow pop up) ─── */
function HeroText() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  const items = [
    { text: "Every claim tied to its source.", delay: 0 },
    { text: "Every source verified by code.", delay: 240, color: C.neon },
  ];

  return (
    <h1 className="display" style={{ lineHeight: 1.08, margin: 0 }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "block" }}>
          <span
            style={{
              color: item.color ?? C.text,
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(65px)",
              transition: `opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${item.delay}ms, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${item.delay}ms`,
              display: "inline-block",
              fontSize: "clamp(2.5rem, 6.2vw, 5.2rem)",
              fontWeight: 800,
            }}
          >
            {item.text}
          </span>
        </span>
      ))}
    </h1>
  );
}

/* ─── STAT CARD ─── */
function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      style={{
        padding: "20px 26px",
        borderRadius: 16,
        background: C.surface,
        border: `1px solid ${C.line}`,
        display: "flex",
        flexDirection: "column",
        gap: 5,
        boxShadow: `0 8px 30px rgba(0,0,0,0.4), 0 0 20px ${color}15`,
      }}
    >
      <span style={{ fontSize: 34, fontWeight: 900, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11.5, color: C.muted, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
}

/* ─── PREVIEW CARD ─── */
function PreviewCard() {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.line}`,
        borderRadius: 20,
        padding: 26,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        boxShadow: `0 0 70px rgba(255,107,0,.1), 0 28px 70px rgba(0,0,0,.6)`,
      }}
    >
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f56" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ffbd2e" }} />
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#27c93f" }} />
        <span style={{ marginLeft: 12, fontSize: 11.5, color: C.muted, fontFamily: "ui-monospace,monospace" }}>
          orbit-launch-post.txt
        </span>
      </div>

      {/* Draft content */}
      <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.95, color: C.text }}>
        Meet Orbit.{" "}
        <mark
          style={{
            background: "transparent",
            textDecoration: "underline",
            textDecorationColor: C.high,
            textDecorationThickness: 2.5,
            textUnderlineOffset: 6,
            borderRadius: 3,
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Our app is 3x faster than any competitor.
        </mark>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: 10,
            background: `linear-gradient(135deg,#d44a00,${C.neon})`,
            color: "#fff",
            fontSize: 10.5,
            fontWeight: 800,
            marginLeft: 5,
            verticalAlign: "text-top",
            boxShadow: `0 0 10px rgba(255,107,0,.5)`,
          }}
        >
          1
        </span>{" "}
        <mark
          style={{
            background: "transparent",
            textDecoration: "underline",
            textDecorationColor: C.ok,
            textDecorationThickness: 2.5,
            textUnderlineOffset: 6,
            borderRadius: 3,
            color: "inherit",
            cursor: "pointer",
          }}
        >
          Plans start at $29.
        </mark>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: 10,
            background: `linear-gradient(135deg,#d44a00,${C.neon})`,
            color: "#fff",
            fontSize: 10.5,
            fontWeight: 800,
            marginLeft: 5,
            verticalAlign: "text-top",
            boxShadow: `0 0 10px rgba(255,107,0,.5)`,
          }}
        >
          2
        </span>
      </p>

      {/* Divider */}
      <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 13.5 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: 10,
              background: `linear-gradient(135deg,#d44a00,${C.neon})`,
              color: "#fff",
              fontSize: 10.5,
              fontWeight: 800,
              flexShrink: 0,
              marginTop: 1,
              boxShadow: `0 0 8px rgba(255,107,0,.4)`,
            }}
          >
            1
          </span>
          <span>
            <span style={{ fontWeight: 800, color: C.high }}>High risk</span>{" "}
            <span style={{ color: C.text2 }}>No approved benchmark found</span>{" "}
            <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 11, color: C.muted }}>POLICY_V2_SEC_4</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 13.5 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              borderRadius: 10,
              background: `linear-gradient(135deg,#d44a00,${C.neon})`,
              color: "#fff",
              fontSize: 10.5,
              fontWeight: 800,
              flexShrink: 0,
              marginTop: 1,
              boxShadow: `0 0 8px rgba(255,107,0,.4)`,
            }}
          >
            2
          </span>
          <span>
            <span style={{ fontWeight: 800, color: C.ok }}>Supported</span>{" "}
            <span style={{ color: C.text2 }}>Matches pricing sheet v2</span>{" "}
            <span style={{ fontFamily: "ui-monospace,monospace", fontSize: 11, color: C.muted }}>PRICING_V2</span>
          </span>
        </div>
      </div>

      {/* Stale row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: C.raised,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: "12px 16px",
          fontSize: 13.5,
        }}
      >
        <span>
          Starter price <s style={{ color: C.muted, fontVariantNumeric: "tabular-nums" }}>$29</s> to{" "}
          <b style={{ fontVariantNumeric: "tabular-nums", color: C.yellow }}>$39</b>
        </span>
        <span style={{ color: C.high, fontWeight: 800 }}>1 post stale</span>
      </div>
    </div>
  );
}

/* ─── MAIN LANDING PAGE ─── */
export default function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes orbDrift {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(25px, -35px); }
          66% { transform: translate(-20px, 25px); }
        }

        .landing-nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          color: ${C.text2};
          text-decoration: none;
          transition: all .18s ease;
        }
        .landing-nav-link:hover {
          color: ${C.neon};
          background: rgba(255,107,0,.08);
        }

        .offer-card {
          border: 1px solid ${C.line};
          border-radius: 18px;
          padding: 30px 26px;
          background: ${C.surface};
          transition: border-color .25s ease, transform .25s ease, box-shadow .25s ease;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .offer-card:hover {
          border-color: ${C.neon};
          transform: translateY(-6px);
          box-shadow: 0 20px 50px rgba(255,107,0,.14), 0 0 0 1px rgba(255,107,0,.2);
        }

        .faq-item {
          border-top: 1px solid ${C.line};
          padding: 0;
        }
        .faq-item summary {
          cursor: pointer;
          list-style: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 0;
          font-weight: 700;
          font-size: 17px;
          color: ${C.text};
          gap: 16px;
        }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-item summary::after {
          content: "+";
          font-size: 24px;
          color: ${C.neon};
          flex-shrink: 0;
          line-height: 1;
          font-weight: 300;
        }
        .faq-item[open] summary::after { content: "−"; }
        .faq-answer {
          padding: 0 0 24px;
          color: ${C.text2};
          line-height: 1.75;
          font-size: 15px;
        }

        .hero-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 50px;
          padding: 0 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all .25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-btn-primary {
          background: linear-gradient(135deg, #d44a00, ${C.neon});
          color: #fff;
          border: none;
          box-shadow: 0 0 24px rgba(255,107,0,.4);
        }
        .hero-btn-primary:hover {
          box-shadow: 0 0 40px rgba(255,107,0,.65);
          transform: translateY(-3px) scale(1.02);
        }
        .hero-btn-secondary {
          background: rgba(255,149,0,.08);
          color: ${C.yellow};
          border: 1px solid rgba(255,149,0,.35);
        }
        .hero-btn-secondary:hover {
          background: rgba(255,149,0,.15);
          border-color: ${C.yellow};
          box-shadow: 0 0 24px rgba(255,149,0,.25);
          transform: translateY(-3px) scale(1.02);
        }
      `}</style>

      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "0%",
            width: 750,
            height: 750,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,107,0,.14) 0%, transparent 65%)",
            animation: "orbDrift 20s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-10%",
            left: "5%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,149,0,.08) 0%, transparent 65%)",
            animation: "orbDrift 26s ease-in-out 3s infinite reverse",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ─── NAVBAR ─── */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 32px",
            height: 74,
            position: "relative",
            zIndex: 30,
            opacity: mounted ? 1 : 0,
            transition: "opacity .8s ease 100ms",
          }}
        >
          <Logo />
          <nav style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Link href="/menu" className="landing-nav-link font-bold text-[#ff9500]">
              Menu Directory
            </Link>
            <a href="#product" className="landing-nav-link">
              Offerings
            </a>
            <a href="#faq" className="landing-nav-link">
              FAQ
            </a>
            <div style={{ width: 1, height: 22, background: C.line, margin: "0 6px" }} />
            <NavMenu />
          </nav>
        </header>

        {/* ─── HERO ─── */}
        <section style={{ minHeight: "82vh", display: "flex", flexDirection: "column", marginTop: -74 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 32,
              padding: "115px 32px 36px",
            }}
          >
            {/* Eyebrow badge with slow entrance */}
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(35px)",
                transition: "opacity 1.1s cubic-bezier(0.16, 1, 0.3, 1) 120ms, transform 1.1s cubic-bezier(0.16, 1, 0.3, 1) 120ms",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "7px 18px",
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 800,
                  letterSpacing: ".08em",
                  border: `1px solid rgba(255,107,0,.35)`,
                  color: C.neon,
                  background: "rgba(255,107,0,.08)",
                  boxShadow: "0 0 20px rgba(255,107,0,0.15)",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: C.neon,
                    boxShadow: `0 0 8px ${C.neon}`,
                    display: "inline-block",
                  }}
                />
                CLAIMS CHECKED AGAINST THEIR SOURCES
              </span>
            </div>

            {/* Headline popping up slowly */}
            <HeroText />

            {/* Subtitle popping up slowly */}
            <p
              style={{
                maxWidth: 520,
                color: C.text2,
                lineHeight: 1.8,
                fontSize: 16.5,
                margin: 0,
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(40px)",
                transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 400ms, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 400ms",
              }}
            >
              Guardian AI reviews marketing drafts against approved brand and pricing sources, then continuously flags every post when facts drift.
            </p>

            {/* Buttons popping up slowly from bottom */}
            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                justifyContent: "center",
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(45px)",
                transition: "opacity 1.3s cubic-bezier(0.16, 1, 0.3, 1) 600ms, transform 1.3s cubic-bezier(0.16, 1, 0.3, 1) 600ms",
              }}
            >
              <Link href="/demo" className="hero-btn hero-btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Explore interactive demo
              </Link>
              <Link href="/demo" className="hero-btn hero-btn-secondary">
                See sample demo
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Stats row popping up slowly */}
            <div
              style={{
                display: "flex",
                gap: 18,
                flexWrap: "wrap",
                justifyContent: "center",
                marginTop: 10,
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(35px)",
                transition: "opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1) 750ms, transform 1.4s cubic-bezier(0.16, 1, 0.3, 1) 750ms",
              }}
            >
              {[
                { value: "< 2s", label: "Deterministic Check", color: C.neon },
                { value: "100%", label: "Claims Cited", color: C.ok },
                { value: "0", label: "Unverified Drift", color: C.yellow },
              ].map((s) => (
                <StatCard key={s.label} {...s} />
              ))}
            </div>
          </div>

          {/* Bigger vertical wave lines */}
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transition: "opacity 1.5s ease 800ms",
            }}
          >
            <Wave />
          </div>
        </section>

        {/* ─── SCROLL REVEAL SECTIONS: PRODUCT PREVIEW ─── */}
        <section style={{ maxWidth: 1150, margin: "0 auto", padding: "100px 32px" }}>
          <div style={{ display: "grid", gap: 52, gridTemplateColumns: "1fr 1.15fr", alignItems: "center" }}>
            <Reveal>
              <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(255,107,0,.09)",
                    border: `1px solid rgba(255,107,0,.3)`,
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: C.neon,
                    letterSpacing: ".08em",
                    width: "fit-content",
                  }}
                >
                  PROOF SHEET ENGINE
                </div>
                <h2 className="display" style={{ fontSize: "clamp(2rem,3.8vw,3rem)", margin: 0, fontWeight: 800 }}>
                  Review like a proof sheet
                </h2>
                <p style={{ color: C.text2, maxWidth: 420, lineHeight: 1.8, margin: 0, fontSize: 15.5 }}>
                  Each flagged claim carries a numbered badge that directly matches its finding, quoting the exact policy or pricing passage beside it.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <Link href="/demo" className="hero-btn hero-btn-primary">
                    Explore demo →
                  </Link>
                  <Link href="/menu" className="hero-btn hero-btn-secondary">
                    View menu
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <PreviewCard />
            </Reveal>
          </div>
        </section>

        {/* ─── SCROLL REVEAL SECTIONS: OUR OFFERINGS ─── */}
        <section id="product" style={{ maxWidth: 1150, margin: "0 auto", padding: "80px 32px" }}>
          <Reveal>
            <div style={{ marginBottom: 52 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "rgba(255,149,0,.08)",
                  border: `1px solid rgba(255,149,0,.3)`,
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: C.yellow,
                  letterSpacing: ".08em",
                  marginBottom: 16,
                }}
              >
                PLATFORM CAPABILITIES
              </div>
              <h2 className="display" style={{ fontSize: "clamp(2.2rem,4vw,3.4rem)", margin: 0, fontWeight: 800 }}>
                Our offerings
              </h2>
            </div>
          </Reveal>

          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {OFFERS.map((o, i) => (
              <Reveal key={o.title} delay={i * 120}>
                <div className="offer-card">
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background: C.raised,
                      border: `1px solid ${C.line}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {o.icon}
                  </div>
                  <div>
                    <h3 className="display" style={{ fontSize: "1.35rem", margin: "0 0 10px", color: C.text, fontWeight: 700 }}>
                      {o.title}
                    </h3>
                    <p style={{ color: C.text2, lineHeight: 1.75, margin: 0, fontSize: 14.5 }}>
                      {o.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ─── SCROLL REVEAL SECTIONS: HUMAN IN THE LOOP ─── */}
        <section style={{ maxWidth: 1150, margin: "0 auto", padding: "80px 32px" }}>
          <Reveal>
            <div
              style={{
                background: C.surface,
                border: `1px solid ${C.line}`,
                borderRadius: 24,
                padding: "60px 52px",
                display: "grid",
                gap: 40,
                gridTemplateColumns: "1fr 1fr",
                alignItems: "center",
                boxShadow: `0 0 90px rgba(255,107,0,.07)`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(0,229,160,.09)",
                    border: `1px solid rgba(0,229,160,.3)`,
                    fontSize: 11.5,
                    fontWeight: 800,
                    color: C.ok,
                    letterSpacing: ".08em",
                    width: "fit-content",
                  }}
                >
                  GOVERNANCE
                </div>
                <h2 className="display" style={{ fontSize: "clamp(2rem,3.4vw,2.8rem)", margin: 0, fontWeight: 800 }}>
                  A human always decides
                </h2>
                <p style={{ color: C.text2, lineHeight: 1.8, margin: 0, fontSize: 15 }}>
                  Guardian flags and suggests. A reviewer approves every modification, and each decision is recorded into an append-only audit log.
                </p>
                <Link href="/demo" className="hero-btn hero-btn-primary" style={{ width: "fit-content", marginTop: 8 }}>
                  Explore demo →
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { step: "01", text: "Instant rule checks flag competitors and banned terms", color: C.neon },
                  { step: "02", text: "Verified claims matched with retrieved knowledge evidence", color: C.yellow },
                  { step: "03", text: "Human reviewer approves, edits, or dismisses each finding", color: C.ok },
                  { step: "04", text: "Living ledger tracks upstream fact changes to alert on drift", color: C.text2 },
                ].map((s) => (
                  <div
                    key={s.step}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      padding: "12px 18px",
                      borderRadius: 12,
                      background: "rgba(255,107,0,0.02)",
                      border: "1px solid rgba(255,107,0,0.06)",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 900, color: s.color, fontFamily: "ui-monospace,monospace", flexShrink: 0 }}>
                      {s.step}
                    </span>
                    <span style={{ color: C.text, fontSize: 14.5, fontWeight: 500 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* ─── SCROLL REVEAL SECTIONS: FAQ ─── */}
        <section id="faq" style={{ maxWidth: 800, margin: "0 auto", padding: "80px 32px" }}>
          <Reveal>
            <h2 className="display" style={{ fontSize: "clamp(2.2rem,4vw,3.2rem)", marginBottom: 44, fontWeight: 800 }}>
              FAQ
            </h2>
          </Reveal>
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} delay={i * 90}>
              <details className="faq-item">
                <summary>{q}</summary>
                <p className="faq-answer">{a}</p>
              </details>
            </Reveal>
          ))}
        </section>

        {/* ─── FOOTER ─── */}
        <footer
          style={{
            borderTop: `1px solid ${C.line}`,
            maxWidth: 1200,
            margin: "0 auto",
            padding: "36px 32px 48px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <Logo size="sm" />
          <span style={{ fontSize: 13, color: C.muted }}>
            Built by The Bloodline for the Inkloom AI Challenge
          </span>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/menu" style={{ fontSize: 13.5, color: C.yellow, fontWeight: 700, textDecoration: "none" }}>
              Menu
            </Link>
            <Link href="/demo" style={{ fontSize: 13.5, color: C.text2, textDecoration: "none" }}>
              Analyze
            </Link>
            <Link href="/demo" style={{ fontSize: 13.5, color: C.text2, textDecoration: "none" }}>
              Review
            </Link>
            <Link href="/login" style={{ fontSize: 13.5, color: C.text2, textDecoration: "none" }}>
              Admin
            </Link>
            <Link href="/demo" style={{ fontSize: 13.5, color: C.text2, textDecoration: "none" }}>
              Ledger
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
