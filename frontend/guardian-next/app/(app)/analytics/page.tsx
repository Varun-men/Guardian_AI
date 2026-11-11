"use client";
import { useLedger } from "@/lib/ledger-store";
import { evalMetrics } from "@/lib/eval";
import type { Severity } from "@/lib/types";

const SEV = [
  { key: "HIGH", label: "High risk", tone: "high" },
  { key: "MEDIUM", label: "Medium risk", tone: "medium" },
  { key: "SUPPORTED", label: "Supported", tone: "supported" },
  { key: "ACCESSIBILITY", label: "Accessibility", tone: "accessibility" },
];
const pct = (v: number | null) => (v === null ? "Not measured yet" : `${Math.round(v * 100)}%`);

export default function AnalyticsPage() {
  const { stats, staleCount, posts } = useLedger();
  const total = Object.values(stats.bySeverity).reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...Object.values(stats.bySeverity));
  const decided = stats.applied + stats.dismissed;

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <header>
        <h1 className="text-3xl display">Analytics</h1>
        <p className="muted text-sm">Counts update as you analyse and review drafts in this session.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Summary">
        {[
          ["Findings", total],
          ["Posts approved", stats.approved],
          ["Posts in ledger", posts.length],
          ["Stale posts", staleCount],
        ].map(([label, n]) => (
          <div key={label as string} className="panel p-4">
            <p className="text-3xl font-medium num">{n}</p>
            <p className="muted text-sm">{label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="panel p-5 flex flex-col gap-3" aria-label="Issues by severity">
          <h2 className="font-medium">Issues by severity</h2>
          {total === 0 ? <p className="muted text-sm">No drafts analysed yet. Analyse one to see the breakdown.</p> : SEV.map((s) => {
            const n = stats.bySeverity[s.key as Severity] ?? 0;
            return (
              <div key={s.key} className={`tone-${s.tone}`}>
                <div className="flex justify-between text-sm mb-1"><span>{s.label}</span><span className="muted">{n}</span></div>
                <div className="h-2 rounded-full" style={{ background: "var(--raised)" }}>
                  <div className="h-2 rounded-full" style={{ width: `${(n / max) * 100}%`, background: "var(--tone)" }} />
                </div>
              </div>
            );
          })}
        </section>

        <section className="panel p-5 flex flex-col gap-3" aria-label="Reviewer decisions">
          <h2 className="font-medium">Reviewer decisions</h2>
          {decided === 0 ? <p className="muted text-sm">No fixes accepted or dismissed yet</p> : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden" style={{ background: "var(--raised)" }}>
                <div style={{ width: `${(stats.applied / decided) * 100}%`, background: "var(--neon)" }} />
                <div style={{ width: `${(stats.dismissed / decided) * 100}%`, background: "var(--muted)" }} />
              </div>
              <p className="text-sm"><span className="neon">{stats.applied} accepted</span> · <span className="muted">{stats.dismissed} dismissed</span> · {Math.round((stats.applied / decided) * 100)}% accept rate</p>
            </>
          )}
        </section>
      </div>

      <section className="panel p-5 flex flex-col gap-3" aria-label="Evaluation metrics">
        <div className="flex items-center gap-2">
          <h2 className="font-medium">Evaluation metrics</h2>
          <span className="chip tone-neon">{evalMetrics.sampleSize === null ? "No sample yet" : `n = ${evalMetrics.sampleSize} labelled cases`}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[["Precision", evalMetrics.precision], ["Recall", evalMetrics.recall],
            ["Citation validity", evalMetrics.citationValidity], ["Ledger impact accuracy", evalMetrics.ledgerImpactAccuracy]].map(([l, v]) => (
            <div key={l as string} className="panel-raised p-3">
              <p className={`text-xl font-medium ${v === null ? "muted" : "neon"}`}>{pct(v as number | null)}</p>
              <p className="muted text-sm">{l}</p>
            </div>
          ))}
        </div>
        <p className="muted text-xs">Values come from the team's eval scripts via lib/eval.ts.</p>
      </section>
    </div>
  );
}
