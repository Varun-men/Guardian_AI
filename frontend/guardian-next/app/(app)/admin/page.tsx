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
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-display)]">Admin facts</h1>
        <p className="text-[#a1a1aa] text-sm mt-1">
          Approved values every post is checked against. Changing one flags every linked post.
        </p>
      </header>

      {result && (
        <div
          role="status"
          className="panel p-4 flex items-center justify-between gap-3 border border-[#ff6b00]/40 bg-[#ff6b00]/10 rounded-xl"
          style={{ boxShadow: "0 0 20px rgba(255,107,0,0.18)" }}
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b00] animate-pulse" />
            <p className="text-sm font-medium text-white">{result}</p>
          </div>
          <Link
            href="/ledger"
            className="btn btn-primary text-xs px-3.5 py-1.5 h-auto font-semibold"
          >
            Open Living Ledger →
          </Link>
        </div>
      )}

      {/* Facts List */}
      <section className="flex flex-col gap-4" aria-label="Facts">
        {facts.map((f) => {
          const linked = posts.filter((p) => p.fact_id === f.id).length;
          const val = drafts[f.id] ?? String(f.value);
          const changed = drafts[f.id] !== undefined && Number(val) !== f.value && val !== "";
          return (
            <div
              key={f.id}
              className="panel p-5 flex flex-wrap items-center justify-between gap-4 transition-all duration-200 hover:border-[#ff6b00]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
            >
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-base text-white">{f.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-[#ff6b00]/30 bg-[#ff6b00]/10 text-[#ff6b00] font-mono">
                    v{f.version}
                  </span>
                </div>
                <p className="text-xs text-[#a1a1aa] font-mono mt-1.5 flex items-center gap-2">
                  <span>{f.id}</span>
                  <span className="text-[#71717a]">•</span>
                  <span>source v{f.version}</span>
                  <span className="text-[#71717a]">•</span>
                  <span className={linked > 0 ? "text-[#ff9500]" : "text-[#a1a1aa]"}>
                    {linked} linked post{linked === 1 ? "" : "s"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2.5 text-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">Price ($)</span>
                  <input
                    type="number"
                    min={0}
                    value={val}
                    onChange={(e) => setDrafts({ ...drafts, [f.id]: e.target.value })}
                    className="panel-raised px-3 py-1.5 w-24 text-center font-mono font-semibold text-white focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00]"
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
        <div className="flex items-center justify-between border-b border-[#ff6b00]/15 pb-3">
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
                className="panel-raised p-3.5 text-sm flex flex-wrap items-center gap-3 border border-white/5 hover:border-[#ff6b00]/25 transition-colors"
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
