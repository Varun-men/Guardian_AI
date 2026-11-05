
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
        <h1 className="text-3xl font-bold tracking-tight text-[#e8f4ff] font-[family-name:var(--font-display)]">
          Living Claim Ledger
        </h1>

        <p className="text-[#7ab3cc] text-sm mt-1">
          Approved claims remain linked to verified facts. Changing an
          upstream fact flags every downstream post.
        </p>
      </header>

      {/* Overall status */}
      {staleCount > 0 ? (
        <div
          role="alert"
          className="panel p-5 border border-[#ff4d6d]/40 bg-[#ff4d6d]/10 rounded-xl"
          style={{ boxShadow: "0 0 24px rgba(255,77,109,0.15)" }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d6d] animate-pulse" />
            <p className="font-bold text-[#ff4d6d]">
              {staleCount} approved post{staleCount === 1 ? " contains" : "s contain"} outdated facts
            </p>
          </div>

          <p className="text-xs text-[#7ab3cc] mt-1">
            Review and synchronize these posts with the latest fact values.
          </p>
        </div>
      ) : unverifiedCount > 0 ? (
        <div className="panel p-5 border border-[#ff8c00]/30 bg-[#ff8c00]/5 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff8c00]" />
            <p className="font-bold text-[#ff8c00]">
              {unverifiedCount} approved post{unverifiedCount === 1 ? " has" : "s have"} no linked supporting fact
            </p>
          </div>

          <p className="text-xs text-[#7ab3cc] mt-1">
            These posts have been approved by a reviewer but are not
            synchronized with a verified Ledger fact.
          </p>
        </div>
      ) : (
        <div className="panel p-4 text-sm text-[#7ab3cc] flex items-center gap-3 border border-[#00e5a0]/30 bg-[#00e5a0]/5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-[#00e5a0] shadow-[0_0_8px_#00e5a0]" />
          <span>
            All approved posts are linked to existing facts and synchronized.
          </span>
        </div>
      )}

      {/* Status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="panel p-4 border border-[#00e5a0]/20">
          <p className="text-xs text-[#7ab3cc]">Current</p>
          <p className="text-2xl font-bold text-[#00e5a0] mt-1">
            {posts.filter((post) => {
              const fact = facts.find((item) => item.id === post.fact_id);
              return !isStale(post) && Boolean(post.fact_id && fact);
            }).length}
          </p>
        </div>

        <div className="panel p-4 border border-[#ff4d6d]/20">
          <p className="text-xs text-[#7ab3cc]">Stale</p>
          <p className="text-2xl font-bold text-[#ff4d6d] mt-1">
            {staleCount}
          </p>
        </div>

        <div className="panel p-4 border border-[#ff8c00]/20">
          <p className="text-xs text-[#7ab3cc]">Unverified</p>
          <p className="text-2xl font-bold text-[#ff8c00] mt-1">
            {unverifiedCount}
          </p>
        </div>
      </div>

      {/* Post cards */}
      <div className="flex flex-col gap-4">
        {posts.length === 0 ? (
          <div className="panel p-8 text-center text-[#7ab3cc]">
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
              ? "bg-[#ff4d6d]/15 border-[#ff4d6d]/40 text-[#ff4d6d]"
              : unverified
                ? "bg-[#ff8c00]/15 border-[#ff8c00]/40 text-[#ff8c00]"
                : "bg-[#00e5a0]/15 border-[#00e5a0]/40 text-[#00e5a0]";

            return (
              <section
                key={p.id}
                className={`panel p-6 flex flex-col gap-4 transition-all duration-200 border ${
                  stale
                    ? "border-[#ff4d6d]/40 shadow-[0_8px_30px_rgba(255,77,109,0.1)]"
                    : unverified
                      ? "border-[#ff8c00]/30"
                      : "border-[#00c8ff]/15 hover:border-[#00c8ff]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-semibold text-base text-[#e8f4ff]">
                      {p.title}
                    </h2>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${statusClass}`}
                    >
                      {status}
                    </span>
                  </div>

                  {fact && (
                    <span className="text-xs font-mono text-[#7ab3cc]">
                      Linked:{" "}
                      <strong className="text-[#00c8ff]">
                        {fact.label}
                      </strong>{" "}
                      (${fact.value})
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-black/25 border border-white/5 text-sm text-[#e8f4ff] leading-relaxed">
                  {p.text}
                </div>

                {unverified && (
                  <div className="p-3 rounded-lg bg-[#ff8c00]/5 border border-[#ff8c00]/20 text-xs text-[#ffb45c]">
                    Reviewer approved this post, but it has no valid linked
                    supporting fact. Approval does not mean the claims have
                    been independently verified.
                  </div>
                )}

                {stale && fact && (
                  <div className="p-3.5 rounded-lg bg-[#ffe600]/10 border border-[#ffe600]/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm">
                      <span className="text-[#7ab3cc] font-medium">
                        {fact.label} changed:{" "}
                      </span>

                      <s className="text-[#7ab3cc] font-mono mr-2">
                        {p.token}
                      </s>

                      <span className="text-[#7ab3cc]">→</span>

                      <b className="text-[#ffe600] font-mono ml-2 text-base">
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

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#7ab3cc] font-mono border-t border-white/5 pt-3">
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
