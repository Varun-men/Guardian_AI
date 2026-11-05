"use client";

import { useLedger } from "@/lib/ledger-store";

export default function LedgerPage() {
  const { posts, facts, isStale, staleCount, fixPost } = useLedger();

  const unverifiedCount = posts.filter((post) => {
    const fact = facts.find((item) => item.id === post.fact_id);
    return !post.fact_id || !fact;
  }).length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-display)]">
          Living Claim Ledger
        </h1>

        <p className="text-[#a1a1aa] text-sm mt-1">
          Approved claims remain linked to verified facts. Changing an
          upstream fact flags every downstream post.
        </p>
      </header>

      {/* Overall status */}
      {staleCount > 0 ? (
        <div
          role="alert"
          className="panel p-5 border border-[#ef4444]/40 bg-[#ef4444]/10 rounded-xl"
          style={{ boxShadow: "0 0 24px rgba(239,68,68,0.18)" }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
            <p className="font-bold text-[#ef4444]">
              {staleCount} approved post{staleCount === 1 ? " contains" : "s contain"} outdated facts
            </p>
          </div>

          <p className="text-xs text-[#a1a1aa] mt-1">
            Review and synchronize these posts with the latest fact values.
          </p>
        </div>
      ) : unverifiedCount > 0 ? (
        <div className="panel p-5 border border-[#ff6b00]/30 bg-[#ff6b00]/5 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b00]" />
            <p className="font-bold text-[#ff6b00]">
              {unverifiedCount} approved post{unverifiedCount === 1 ? " has" : "s have"} no linked supporting fact
            </p>
          </div>

          <p className="text-xs text-[#a1a1aa] mt-1">
            These posts have been approved by a reviewer but are not
            synchronized with a verified Ledger fact.
          </p>
        </div>
      ) : (
        <div className="panel p-4 text-sm text-[#a1a1aa] flex items-center gap-3 border border-[#10b981]/30 bg-[#10b981]/5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
          <span>
            All approved posts are linked to existing facts and synchronized.
          </span>
        </div>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="panel p-4 border border-[#10b981]/20">
          <p className="text-xs text-[#a1a1aa]">Current</p>
          <p className="text-2xl font-bold text-[#10b981] mt-1">
            {posts.filter((post) => {
              const fact = facts.find((item) => item.id === post.fact_id);
              return !isStale(post) && Boolean(post.fact_id && fact);
            }).length}
          </p>
        </div>

        <div className="panel p-4 border border-[#ef4444]/20">
          <p className="text-xs text-[#a1a1aa]">Stale</p>
          <p className="text-2xl font-bold text-[#ef4444] mt-1">
            {staleCount}
          </p>
        </div>

        <div className="panel p-4 border border-[#ff6b00]/20">
          <p className="text-xs text-[#a1a1aa]">Unverified</p>
          <p className="text-2xl font-bold text-[#ff6b00] mt-1">
            {unverifiedCount}
          </p>
        </div>
      </div>

      {/* Post cards */}
      <div className="flex flex-col gap-4">
        {posts.length === 0 ? (
          <div className="panel p-8 text-center text-[#a1a1aa]">
            No approved posts yet. Analyze and approve a draft to add it here.
          </div>
        ) : (
          posts.map((p) => {
            const stale = isStale(p);
            const fact = facts.find((f) => f.id === p.fact_id);
            const unverified = !p.fact_id || !fact;

            const status = stale
              ? "Stale"
              : unverified
                ? "Unverified"
                : "Current";

            const statusClass = stale
              ? "bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444]"
              : unverified
                ? "bg-[#ff6b00]/15 border-[#ff6b00]/40 text-[#ff6b00]"
                : "bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]";

            return (
              <section
                key={p.id}
                className={`panel p-6 flex flex-col gap-4 transition-all duration-200 border ${
                  stale
                    ? "border-[#ef4444]/40 shadow-[0_8px_30px_rgba(239,68,68,0.1)]"
                    : unverified
                      ? "border-[#ff6b00]/30"
                      : "border-[#ff6b00]/15 hover:border-[#ff6b00]/35 hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-semibold text-base text-white">
                      {p.title}
                    </h2>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusClass}`}
                    >
                      {status}
                    </span>
                  </div>

                  {fact && (
                    <span className="text-xs font-mono text-[#a1a1aa]">
                      Linked:{" "}
                      <strong className="text-[#ff6b00]">
                        {fact.label}
                      </strong>{" "}
                      (${fact.value})
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-sm text-white leading-relaxed">
                  {p.text}
                </div>

                {unverified && (
                  <div className="p-3 rounded-lg bg-[#ff6b00]/5 border border-[#ff6b00]/20 text-xs text-[#ff9500]">
                    Reviewer approved this post, but it has no valid linked
                    supporting fact. Approval does not mean the claims have
                    been independently verified.
                  </div>
                )}

                {stale && fact && (
                  <div className="p-3.5 rounded-lg bg-[#ff9500]/10 border border-[#ff9500]/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm">
                      <span className="text-[#a1a1aa] font-medium">
                        {fact.label} changed:{" "}
                      </span>

                      <s className="text-[#71717a] font-mono mr-2">
                        {p.token}
                      </s>

                      <span className="text-[#a1a1aa]">→</span>

                      <b className="text-[#ff9500] font-mono ml-2 text-base">
                        ${fact.value}
                      </b>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary text-xs px-4 py-1.5 h-auto font-bold"
                      onClick={() => fixPost(p.id)}
                    >
                      Update to ${fact.value} &amp; Sync Post
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#71717a] font-mono border-t border-white/5 pt-3">
                  <span>Post ID: {p.id}</span>
                  <span>Audit log: Local browser storage (editable)</span>
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
