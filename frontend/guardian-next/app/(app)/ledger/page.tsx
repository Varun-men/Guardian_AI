"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLedger } from "@/lib/ledger-store";

export default function LedgerPage() {
  const { posts, facts, isStale, staleCount, fixPost, fixAllStalePosts, resetToDemoData } = useLedger();
  const [filter, setFilter] = useState<"all" | "stale" | "current" | "unverified">("all");
  const [feedback, setFeedback] = useState<string | null>(null);

  const unverifiedCount = posts.filter((post) => {
    const fact = facts.find((item) => item.id === post.fact_id);
    return !post.fact_id || !fact;
  }).length;

  const currentCount = posts.filter((post) => {
    const fact = facts.find((item) => item.id === post.fact_id);
    return !isStale(post) && Boolean(post.fact_id && fact);
  }).length;

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const stale = isStale(post);
      const fact = facts.find((f) => f.id === post.fact_id);
      const unverified = !post.fact_id || !fact;

      if (filter === "stale") return stale;
      if (filter === "current") return !stale && !unverified;
      if (filter === "unverified") return unverified;
      return true;
    });
  }, [posts, filter, facts]);

  const handleSyncAll = () => {
    fixAllStalePosts();
    setFeedback(`Synchronized all stale posts with the latest Fact Registry prices.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleReset = () => {
    if (confirm("Reset Ledger and Fact Registry back to standard demo baseline?")) {
      resetToDemoData();
      setFeedback("Ledger reset to baseline demo data.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* ─── Header & Sync Controls ─── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-display)]">
            Living Claim Ledger
          </h1>

          <p className="text-[#a1a1aa] text-sm mt-1">
            Approved claims remain linked to verified facts. Changing an
            upstream fact in the Registry flags every downstream post in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {staleCount > 0 && (
            <button
              type="button"
              onClick={handleSyncAll}
              className="btn btn-primary"
            >
              ⚡ Sync All ({staleCount}) Stale Posts
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="btn text-xs text-[#a1a1aa] hover:text-white"
            title="Reset to default demo data"
          >
            Reset Demo Data
          </button>
        </div>
      </header>

      {/* ─── Feedback Toast / Alert ─── */}
      {feedback && (
        <div
          role="status"
          className="p-3.5 rounded-xl border border-[#10b981]/40 bg-[#10b981]/10 text-sm text-white flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs text-[#10b981] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Overall Status Banner ─── */}
      {staleCount > 0 ? (
        <div
          role="alert"
          className="panel p-5 border border-[#ef4444]/40 bg-[#ef4444]/10 rounded-xl flex flex-wrap items-center justify-between gap-4"
          style={{ boxShadow: "0 0 24px rgba(239,68,68,0.18)" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
              <p className="font-bold text-[#ef4444]">
                {staleCount} approved post{staleCount === 1 ? " contains" : "s contain"} outdated pricing facts
              </p>
            </div>
            <p className="text-xs text-[#a1a1aa] mt-1">
              An upstream Fact changed. Review individual posts or click &ldquo;Sync All&rdquo; to propagate updates.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSyncAll}
            className="btn text-xs px-4 py-1.5 h-auto font-bold border-[#ef4444]/40 bg-[#ef4444]/20 text-white hover:bg-[#ef4444]/30"
          >
            Auto-Sync All {staleCount} Posts →
          </button>
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
            These posts have been approved by a reviewer but are not synchronized with a verified Ledger fact.
          </p>
        </div>
      ) : (
        <div className="panel p-4 text-sm text-[#a1a1aa] flex items-center justify-between border border-[#10b981]/30 bg-[#10b981]/5 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]" />
            <span>
              All approved posts are linked to existing facts and synchronized with the latest approved values.
            </span>
          </div>
          <Link href="/admin" className="text-xs text-[#ff6b00] hover:underline font-semibold font-mono">
            Edit Facts in Registry →
          </Link>
        </div>
      )}

      {/* ─── Filter Status Tabs ─── */}
      <div className="flex items-center gap-2 border-b border-[#ff6b00]/15 pb-2 flex-wrap">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            filter === "all"
              ? "bg-[#ff6b00] text-black shadow-[0_0_12px_rgba(255,107,0,0.3)]"
              : "text-[#a1a1aa] hover:text-white bg-black/40 border border-white/5"
          }`}
        >
          <span>All Posts</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
            {posts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("stale")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            filter === "stale"
              ? "bg-[#ef4444] text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              : "text-[#a1a1aa] hover:text-white bg-black/40 border border-white/5"
          }`}
        >
          <span>Stale Drift</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
            {staleCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("current")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            filter === "current"
              ? "bg-[#10b981] text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              : "text-[#a1a1aa] hover:text-white bg-black/40 border border-white/5"
          }`}
        >
          <span>Current & Synced</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
            {currentCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("unverified")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            filter === "unverified"
              ? "bg-[#ff9500] text-black shadow-[0_0_12px_rgba(255,149,0,0.3)]"
              : "text-[#a1a1aa] hover:text-white bg-black/40 border border-white/5"
          }`}
        >
          <span>Unverified</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30">
            {unverifiedCount}
          </span>
        </button>
      </div>

      {/* ─── Post Cards List ─── */}
      <div className="flex flex-col gap-4">
        {filteredPosts.length === 0 ? (
          <div className="panel p-10 text-center text-[#a1a1aa] flex flex-col items-center gap-3">
            <p className="font-semibold text-white">No posts matching &ldquo;{filter}&rdquo; filter</p>
            <p className="text-xs text-[#71717a] max-w-sm">
              {filter === "stale"
                ? "No posts are currently stale. You can edit fact prices in the Fact Registry to simulate upstream drift."
                : "Analyze and approve drafts from the Analyze studio to add verified posts to this ledger."}
            </p>
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="btn text-xs px-3 py-1.5 h-auto text-[#ff6b00]"
              >
                Show All Posts
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((p) => {
            const stale = isStale(p);
            const fact = facts.find((f) => f.id === p.fact_id);
            const unverified = !p.fact_id || !fact;

            const status = stale
              ? "Stale Drift"
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
                      Linked Source:{" "}
                      <strong className="text-[#ff6b00]">
                        {fact.label}
                      </strong>{" "}
                      (${fact.value} · v{fact.version})
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-sm text-white leading-relaxed">
                  {p.text}
                </div>

                {unverified && (
                  <div className="p-3 rounded-lg bg-[#ff6b00]/5 border border-[#ff6b00]/20 text-xs text-[#ff9500]">
                    Reviewer approved this post, but it has no valid linked
                    supporting fact in the registry.
                  </div>
                )}

                {stale && fact && (
                  <div className="p-3.5 rounded-lg bg-[#ff9500]/10 border border-[#ff9500]/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm">
                      <span className="text-[#a1a1aa] font-medium">
                        Registry price changed:{" "}
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
                  <span>Living Audit: Synchronized with browser memory</span>
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
