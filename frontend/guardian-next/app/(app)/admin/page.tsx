"use client";
import Link from "next/link";
import { useState } from "react";
import { useLedger } from "@/lib/ledger-store";

export default function AdminPage() {
  const { facts, posts, audit, updateFact } = useLedger();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);

  const save = (id: string, label: string) => {
    const flagged = updateFact(id, Number(drafts[id]));
    setDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
    setResult(`${label} saved. ${flagged} approved post${flagged === 1 ? "" : "s"} flagged as stale.`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B"/>
            <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t3)", fontWeight: 600 }}>Ground truth</span>
        </div>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 42px)", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--t1)", margin: "0 0 10px", lineHeight: 1.1 }}>
          Fact Registry
        </h1>
        <p style={{ color: "var(--t2)", fontSize: "16px", margin: 0, lineHeight: 1.65, maxWidth: 600 }}>
          Approved facts every post is checked against. Updating a value immediately flags every linked post as stale in the Living Ledger.
        </p>
      </header>

      {result && (
        <div
          role="status"
          className="panel p-4 flex items-center justify-between gap-3 border border-[var(--blood)]/40 bg-[var(--blood)]/10 rounded-xl"
          style={{ boxShadow: "0 0 20px rgba(176,18,27,0.18)" }}
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--blood)] animate-pulse" />
            <p className="text-sm font-medium text-white">{result}</p>
          </div>
          <Link
            href="/ledger"
            className="btn btn-primary text-xs px-3.5 py-1.5 h-auto font-semibold"
          >
            Open Living Ledger â†’
          </Link>
        </div>
      )}

      {/* Facts summary bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10, background: "var(--s1)", border: "1px solid var(--line)", fontSize: 12, fontFamily: "var(--mono)", color: "var(--t2)" }}>
          <span style={{ color: "var(--t1)", fontWeight: 600 }}>{facts.length}</span>
          <span>FACTS</span>
          <span style={{ opacity: 0.3 }}>Â·</span>
          <span style={{ color: "var(--t1)", fontWeight: 600 }}>{posts.length}</span>
          <span>POSTS LINKED</span>
        </div>
      </div>

      {/* Facts List */}
      <section className="flex flex-col gap-4" aria-label="Facts">
        {facts.map((f) => {
          const linked = posts.filter((p) => p.fact_id === f.id).length;
          const val = drafts[f.id] ?? String(f.value);
          const changed = drafts[f.id] !== undefined && Number(val) !== f.value && val !== "";
          return (
            <div
              key={f.id}
              className="panel p-5 flex flex-wrap items-center justify-between gap-4 admin-fact-row transition-all duration-200 hover:border-[var(--blood)]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-base text-white">{f.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--blood)]/30 bg-[var(--blood)]/10 text-[var(--blood)] font-mono">
                    v{f.version}
                  </span>
                </div>
                <p className="text-xs text-[#a1a1aa] font-mono mt-1.5 flex items-center gap-2">
                  <span>{f.id}</span>
                  <span className="text-[#71717a]">â€¢</span>
                  <span>source v{f.version}</span>
                  <span className="text-[#71717a]">â€¢</span>
                  <span className={linked > 0 ? "text-[#ff9500]" : "text-[#a1a1aa]"}>
                    {linked} linked post{linked === 1 ? "" : "s"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-4 admin-fact-controls">
                <label className="flex items-center gap-2.5 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">Price ($)</span>
                  <input
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) => setDrafts({ ...drafts, [f.id]: e.target.value })}
                    className="panel-raised px-3 py-1.5 w-24 text-center font-mono font-semibold text-white focus:outline-none focus:border-[var(--blood)] focus:ring-1 focus:ring-[var(--blood)]"
                  />
                </label>
                <button
                  className="btn btn-primary"
                  disabled={!changed}
                  onClick={() => save(f.id, f.label)}
                >
                  Save change
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Audit Log */}
      <section className="panel p-6 flex flex-col gap-4" aria-label="Audit log">
        <div className="flex items-center justify-between border-b border-[var(--blood)]/15 pb-3">
          <h2 className="font-semibold text-base text-white flex items-center gap-2">
            Audit log
          </h2>
          <span className="text-xs text-[#a1a1aa] font-mono">{audit.length} entries recorded</span>
        </div>

        {audit.length === 0 ? (
          <div className="py-8 text-center text-sm text-[#a1a1aa]/70">
            No fact changes recorded yet. Adjust a price above to generate audit events.
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {audit.map((a, k) => (
              <li
                key={k}
                className="panel-raised p-3.5 text-sm flex flex-wrap items-center gap-3 border border-white/5 hover:border-[var(--blood)]/25 transition-colors"
              >
                <span className="text-xs text-[#a1a1aa] font-mono">{a.at}</span>
                <span className="chip tone-neon text-[11px] font-mono uppercase">{a.actor}</span>
                <span className="font-semibold text-white">{a.action}</span>
                <span className="text-xs text-[#a1a1aa] flex-1">{a.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

