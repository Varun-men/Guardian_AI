"use client";
import Link from "next/link";
import { useLedger } from "@/lib/ledger-store";
import { evalMetrics } from "@/lib/eval";
import type { Severity } from "@/lib/types";

const SEV: { key: Severity; label: string; color: string }[] = [
  { key: "HIGH",          label: "High risk",     color: "var(--redhi)"  },
  { key: "MEDIUM",        label: "Medium risk",   color: "#f87171"       },
  { key: "SUPPORTED",     label: "Supported",     color: "#10b981"       },
  { key: "ACCESSIBILITY", label: "Accessibility", color: "var(--yellow)" },
];

const pct = (v: number | null) =>
  v === null ? "—" : `${Math.round(v * 100)}%`;

export default function AnalyticsPage() {
  const { stats, staleCount, posts } = useLedger();
  const total   = Object.values(stats.bySeverity).reduce((a, b) => a + b, 0);
  const max     = Math.max(1, ...Object.values(stats.bySeverity));
  const decided = stats.applied + stats.dismissed;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 1100 }}>

      {/* ─── Header ─── */}
      <header>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B"/>
            <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t3)", fontWeight: 600 }}>
            Session metrics
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 42px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--t1)", margin: "0 0 10px", lineHeight: 1.1 }}>
          Analytics
        </h1>
        <p style={{ color: "var(--t2)", fontSize: 16, margin: 0, lineHeight: 1.65, maxWidth: 560 }}>
          Counts update live as you analyze drafts and make reviewer decisions in this session.
        </p>
      </header>

      {/* ─── Summary Stats ─── */}
      <section
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}
        aria-label="Summary statistics"
      >
        {([
          ["Total findings",   total,         "var(--redhi)"],
          ["Posts approved",   stats.approved,"#10b981"],
          ["Posts in ledger",  posts.length,  "var(--t1)"],
          ["Stale posts",      staleCount,    staleCount > 0 ? "var(--yellow)" : "var(--t3)"],
        ] as [string, number, string][]).map(([label, n, color]) => (
          <div
            key={label}
            style={{
              background: "var(--s1)",
              border: "1px solid var(--line)",
              borderRadius: 20,
              padding: "24px 24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 40,
                fontWeight: 700,
                fontFamily: "var(--mono)",
                color,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {n}
            </span>
            <span style={{ fontSize: 12, color: "var(--t3)", fontFamily: "var(--mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {label}
            </span>
          </div>
        ))}
      </section>

      {/* ─── Severity + Decisions side-by-side ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>

        {/* Issues by severity */}
        <section
          style={{ background: "var(--s1)", border: "1px solid var(--line)", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}
          aria-label="Issues by severity"
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--t1)", margin: "0 0 4px" }}>Issues by severity</h2>
            <p style={{ fontSize: 13, color: "var(--t3)", margin: 0 }}>
              {total === 0
                ? "No drafts analyzed yet."
                : `${total} total finding${total === 1 ? "" : "s"} logged.`}
            </p>
          </div>

          {total === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <Link href="/analyze" className="pill ghost" style={{ fontSize: 13 }}>
                Analyze a draft to get started
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SEV.map((s) => {
                const n = stats.bySeverity[s.key] ?? 0;
                return (
                  <div key={s.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <span style={{ fontSize: 14, color: "var(--t2)", fontWeight: 500 }}>{s.label}</span>
                      <span style={{ fontSize: 13, color: s.color, fontFamily: "var(--mono)", fontWeight: 600 }}>{n}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: "var(--s2)", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${(n / max) * 100}%`,
                          background: s.color,
                          borderRadius: 999,
                          transition: "width 0.6s var(--ease)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Reviewer decisions */}
        <section
          style={{ background: "var(--s1)", border: "1px solid var(--line)", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}
          aria-label="Reviewer decisions"
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--t1)", margin: "0 0 4px" }}>Reviewer decisions</h2>
            <p style={{ fontSize: 13, color: "var(--t3)", margin: 0 }}>
              {decided === 0 ? "No decisions recorded yet." : `${decided} decision${decided === 1 ? "" : "s"} recorded.`}
            </p>
          </div>

          {decided === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center" }}>
              <Link href="/review" className="pill ghost" style={{ fontSize: 13 }}>
                Go to Review
              </Link>
            </div>
          ) : (
            <>
              <div style={{ height: 10, borderRadius: 999, overflow: "hidden", display: "flex", background: "var(--s2)" }}>
                <div style={{ width: `${(stats.applied / decided) * 100}%`, background: "#10b981" }} />
                <div style={{ width: `${(stats.dismissed / decided) * 100}%`, background: "var(--t3)", opacity: 0.4 }} />
              </div>

              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "var(--t2)" }}>{stats.applied} accepted</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--t3)", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: "var(--t2)" }}>{stats.dismissed} dismissed</span>
                </div>
              </div>

              <div
                style={{
                  background: "var(--s2)",
                  border: "1px solid var(--line)",
                  borderRadius: 14,
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--t3)", fontFamily: "var(--mono)" }}>Accept rate</span>
                <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--mono)", color: "#10b981" }}>
                  {Math.round((stats.applied / decided) * 100)}%
                </span>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ─── Evaluation Metrics ─── */}
      <section
        style={{ background: "var(--s1)", border: "1px solid var(--line)", borderRadius: 24, padding: 28, display: "flex", flexDirection: "column", gap: 24 }}
        aria-label="Evaluation metrics"
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--t1)", margin: "0 0 4px" }}>Evaluation metrics</h2>
            <p style={{ fontSize: 13, color: "var(--t3)", margin: 0 }}>
              {evalMetrics.sampleSize === null
                ? "No labelled cases yet. Values come from lib/eval.ts once available."
                : `Measured on n\u00a0=\u00a0${evalMetrics.sampleSize} labelled cases from eval scripts.`}
            </p>
          </div>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--mono)",
              color: "var(--redhi)",
              background: "rgba(242,103,95,0.1)",
              border: "1px solid rgba(242,103,95,0.25)",
              borderRadius: 999,
              padding: "3px 12px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {evalMetrics.sampleSize === null ? "No sample" : `n = ${evalMetrics.sampleSize}`}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {([
            ["Precision",              evalMetrics.precision],
            ["Recall",                 evalMetrics.recall],
            ["Citation validity",      evalMetrics.citationValidity],
            ["Ledger impact accuracy", evalMetrics.ledgerImpactAccuracy],
          ] as [string, number | null][]).map(([label, v]) => (
            <div
              key={label}
              style={{
                background: "var(--s2)",
                border: "1px solid var(--line)",
                borderRadius: 16,
                padding: "20px 20px 16px",
              }}
            >
              <p style={{ fontSize: 34, fontWeight: 700, fontFamily: "var(--mono)", color: v === null ? "var(--t3)" : "#10b981", margin: "0 0 6px" }}>
                {pct(v)}
              </p>
              <p style={{ fontSize: 12, color: "var(--t3)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
