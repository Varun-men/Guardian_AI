"use client";
import { useLedger } from "@/lib/ledger-store";

export default function LedgerPage() {
  const { posts, facts, isStale, staleCount, fixPost } = useLedger();

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#e8f4ff] font-[family-name:var(--font-display)]">
          Living Claim Ledger
        </h1>
        <p className="text-[#7ab3cc] text-sm mt-1">
          Approved claims remain linked to verified facts. Changing an upstream fact flags every downstream post.
        </p>
      </header>

      {staleCount > 0 ? (
        <div
          role="alert"
          className="panel p-5 border border-[#ff4d6d]/40 bg-[#ff4d6d]/10 rounded-xl flex items-center justify-between gap-4"
          style={{ boxShadow: "0 0 24px rgba(255,77,109,0.15)" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d6d] animate-pulse" />
              <p className="font-bold text-[#ff4d6d]">
                {staleCount} approved post{staleCount === 1 ? " contains" : "s contain"} outdated pricing
              </p>
            </div>
            <p className="text-xs text-[#7ab3cc] mt-1">
              A fact value changed after initial approval. Review and approve the suggested synchronization below.
            </p>
          </div>
        </div>
      ) : (
        <div className="panel p-4 text-sm text-[#7ab3cc] flex items-center gap-3 border border-[#00e5a0]/30 bg-[#00e5a0]/5">
          <span className="w-2 h-2 rounded-full bg-[#00e5a0] shadow-[0_0_8px_#00e5a0]" />
          <span>All approved posts are synchronized and match current facts.</span>
        </div>
      )}

      {/* Post cards */}
      <div className="flex flex-col gap-4">
        {posts.map((p) => {
          const stale = isStale(p);
          const fact = facts.find((f) => f.id === p.fact_id);
          return (
            <section
              key={p.id}
              className={`panel p-6 flex flex-col gap-4 transition-all duration-200 border ${
                stale
                  ? "border-[#ff4d6d]/40 shadow-[0_8px_30px_rgba(255,77,109,0.1)]"
                  : "border-[#00c8ff]/15 hover:border-[#00c8ff]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-base text-[#e8f4ff]">{p.title}</h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      stale
                        ? "bg-[#ff4d6d]/15 border border-[#ff4d6d]/40 text-[#ff4d6d]"
                        : "bg-[#00e5a0]/15 border border-[#00e5a0]/40 text-[#00e5a0]"
                    }`}
                  >
                    {stale ? "Stale" : "Current"}
                  </span>
                </div>
                {fact && (
                  <span className="text-xs font-mono text-[#7ab3cc]">
                    Linked: <strong className="text-[#00c8ff]">{fact.label}</strong> (${fact.value})
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-black/25 border border-white/5 text-sm text-[#e8f4ff] leading-relaxed">
                {p.text}
              </div>

              {stale && fact && (
                <div className="p-3.5 rounded-lg bg-[#ffe600]/10 border border-[#ffe600]/30 flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="text-[#7ab3cc] font-medium">{fact.label} drifted: </span>
                    <s className="text-[#7ab3cc] line-through font-mono mr-2">{p.token}</s>
                    <span className="text-[#7ab3cc]">→</span>
                    <b className="text-[#ffe600] font-mono ml-2 text-base font-bold">${fact.value}</b>
                  </div>
                  <button
                    className="btn btn-primary text-xs px-4 py-1.5 h-auto font-bold"
                    onClick={() => fixPost(p.id)}
                  >
                    Update to ${fact.value} & Sync Post
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-[#7ab3cc] font-mono border-t border-white/5 pt-3">
                <span>Post ID: {p.id}</span>
                <span>Audit trail status: Immutable</span>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
