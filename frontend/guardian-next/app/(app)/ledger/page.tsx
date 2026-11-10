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
  }, [posts, filter, facts, isStale]);

  const handleSyncAll = () => {
    fixAllStalePosts();
    setFeedback(`Synchronized all stale posts with the latest Fact Registry values.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleReset = () => {
    if (confirm("Reset Ledger and Fact Registry back to standard demo baseline?")) {
      resetToDemoData();
      setFeedback("Ledger reset to baseline demo data.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 1140, margin: "0 auto" }}>
      {/* ─── Header & Sync Controls ─── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p className="kick" style={{ margin: "0 0 10px" }}>
            Append-only verification
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 4.5vw, 48px)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              margin: "0 0 8px",
            }}
          >
            Living Claim Ledger
          </h1>

          <p style={{ color: "var(--t2)", fontSize: 15, maxWidth: 640, margin: 0, lineHeight: 1.6 }}>
            Approved claims remain linked to verified facts. Changing an upstream fact in the
            Registry flags every downstream post in real time.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {staleCount > 0 && (
            <button
              type="button"
              onClick={handleSyncAll}
              className="pill red"
              style={{ height: 38, fontSize: 13, cursor: "pointer" }}
            >
              Sync all ({staleCount}) stale posts
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="pill ghost"
            style={{ height: 38, fontSize: 13, cursor: "pointer" }}
            title="Reset to default demo data"
          >
            Reset demo data
          </button>
        </div>
      </header>

      {/* ─── Feedback Alert Toast ─── */}
      {feedback && (
        <div
          role="status"
          style={{
            padding: "14px 18px",
            borderRadius: 14,
            border: "1px solid #10b981",
            background: "rgba(16, 185, 129, 0.08)",
            color: "var(--t1)",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                flexShrink: 0,
              }}
            />
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{
              background: "none",
              border: "none",
              color: "#10b981",
              fontSize: 12,
              cursor: "pointer",
              fontFamily: "var(--mono)",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Overall Status Banner ─── */}
      {staleCount > 0 ? (
        <div
          role="alert"
          style={{
            background: "var(--s1)",
            border: "1px solid var(--redhi)",
            borderRadius: 18,
            padding: "20px 24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--redhi)",
                  flexShrink: 0,
                }}
              />
              <p style={{ margin: 0, fontWeight: 500, fontSize: 16, color: "var(--t1)" }}>
                {staleCount} approved post{staleCount === 1 ? " contains" : "s contain"} outdated pricing facts
              </p>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--t2)" }}>
              An upstream Fact changed. Review individual posts below or synchronize all at once.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSyncAll}
            className="pill red"
            style={{ height: 38, fontSize: 13, cursor: "pointer" }}
          >
            Auto-sync all {staleCount} posts →
          </button>
        </div>
      ) : unverifiedCount > 0 ? (
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: "20px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--orange)",
                flexShrink: 0,
              }}
            />
            <p style={{ margin: 0, fontWeight: 500, fontSize: 15, color: "var(--t1)" }}>
              {unverifiedCount} approved post{unverifiedCount === 1 ? " has" : "s have"} no linked supporting fact
            </p>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--t2)" }}>
            These posts were reviewed manually without being bound to an automated registry fact token.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 14, color: "var(--t2)" }}>
              All approved posts are linked to verified facts and synchronized with the latest approved values.
            </span>
          </div>
          <Link
            href="/admin"
            className="pill ghost"
            style={{ height: 34, fontSize: 12, padding: "0 14px", fontFamily: "var(--mono)" }}
          >
            Edit facts in registry →
          </Link>
        </div>
      )}

      {/* ─── Filter Status Tabs (Matching Home page WhatTabs) ─── */}
      <div
        className="tabs"
        role="tablist"
        aria-label="Filter posts by ledger status"
        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          onClick={() => setFilter("all")}
          className="tab"
          style={{
            fontFamily: "var(--mono)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>All posts</span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 999,
              fontSize: 11,
              background: filter === "all" ? "rgba(255,255,255,0.2)" : "rgba(255,226,220,0.06)",
            }}
          >
            {posts.length}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={filter === "stale"}
          onClick={() => setFilter("stale")}
          className="tab"
          style={{
            fontFamily: "var(--mono)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>Stale drift</span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 999,
              fontSize: 11,
              background: filter === "stale" ? "rgba(255,255,255,0.2)" : "rgba(245, 184, 46, 0.15)",
              color: filter === "stale" ? "#fff" : "var(--yellow)",
            }}
          >
            {staleCount}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={filter === "current"}
          onClick={() => setFilter("current")}
          className="tab"
          style={{
            fontFamily: "var(--mono)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>Current & synced</span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 999,
              fontSize: 11,
              background: filter === "current" ? "rgba(255,255,255,0.2)" : "rgba(16, 185, 129, 0.15)",
              color: filter === "current" ? "#fff" : "#10b981",
            }}
          >
            {currentCount}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={filter === "unverified"}
          onClick={() => setFilter("unverified")}
          className="tab"
          style={{
            fontFamily: "var(--mono)",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>Unverified</span>
          <span
            style={{
              padding: "1px 6px",
              borderRadius: 999,
              fontSize: 11,
              background: filter === "unverified" ? "rgba(255,255,255,0.2)" : "rgba(236, 122, 28, 0.15)",
              color: filter === "unverified" ? "#fff" : "var(--orange)",
            }}
          >
            {unverifiedCount}
          </span>
        </button>
      </div>

      {/* ─── Post Cards List ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {filteredPosts.length === 0 ? (
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--line)",
              borderRadius: 24,
              padding: "48px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <p style={{ fontWeight: 500, fontSize: 18, color: "var(--t1)", margin: 0 }}>
              No posts matching &ldquo;{filter}&rdquo; filter
            </p>
            <p style={{ fontSize: 14, color: "var(--t3)", maxWidth: 420, margin: 0, lineHeight: 1.6 }}>
              {filter === "stale"
                ? "No posts are currently stale. You can edit fact prices in the Fact Registry to simulate upstream drift."
                : "Analyze and approve drafts from the Analyze studio to add verified posts to this ledger."}
            </p>
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="pill ghost"
                style={{ height: 36, fontSize: 13, marginTop: 8 }}
              >
                Show all posts
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((p) => {
            const stale = isStale(p);
            const fact = facts.find((f) => f.id === p.fact_id);
            const unverified = !p.fact_id || !fact;

            return (
              <section
                key={p.id}
                className="mc"
                style={{
                  background: "var(--s1)",
                  border: `1px solid ${stale ? "var(--redhi)" : "var(--line)"}`,
                  borderRadius: 24,
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  transition: "border-color 0.25s var(--ease), transform 0.25s var(--ease)",
                }}
              >
                {/* Header: Title, status chip, source */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <h2 style={{ fontSize: 19, fontWeight: 500, margin: 0, color: "var(--t1)" }}>
                      {p.title}
                    </h2>

                    <div className="chip">
                      <span className={`d ${stale ? "y" : unverified ? "o" : ""}`} style={{ background: !stale && !unverified ? "#10b981" : undefined }} />
                      {stale ? "1 post stale" : unverified ? "Unverified" : "Current"}
                    </div>
                  </div>

                  {fact && (
                    <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--t3)" }}>
                      Linked Source:{" "}
                      <strong style={{ color: "var(--redhi)", fontWeight: 500 }}>
                        {fact.label}
                      </strong>{" "}
                      (${fact.value} · v{fact.version})
                    </span>
                  )}
                </div>

                {/* Post body */}
                <div
                  style={{
                    background: "var(--s2)",
                    border: "1px solid var(--line)",
                    borderRadius: 16,
                    padding: 20,
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "var(--t1)",
                  }}
                >
                  {p.text}
                </div>

                {/* Stale Fact Visual Box (Matching Card 3 on Home Page) */}
                {stale && fact && (
                  <div
                    style={{
                      background: "var(--s2)",
                      border: "1px solid var(--line)",
                      borderRadius: 16,
                      padding: 20,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span className="m" style={{ color: "var(--t3)" }}>
                        Starter price · Registry fact changed
                      </span>
                      <div
                        className="price"
                        style={{
                          fontSize: 28,
                          fontFamily: "var(--mono)",
                          lineHeight: 1.2,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        <span className="old" style={{ position: "relative", color: "var(--t3)" }}>
                          <s>{p.token}</s>
                        </span>{" "}
                        <span style={{ color: "var(--t2)", margin: "0 6px" }}>→</span>{" "}
                        <span className="new" style={{ color: "var(--yellow)", opacity: 1 }}>
                          ${fact.value}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="pill red"
                      style={{ height: 38, fontSize: 13, cursor: "pointer" }}
                      onClick={() => fixPost(p.id)}
                    >
                      Update to ${fact.value} &amp; sync post
                    </button>
                  </div>
                )}

                {/* Unverified Warning note */}
                {unverified && (
                  <div
                    style={{
                      background: "var(--s2)",
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: "12px 16px",
                      fontSize: 13,
                      color: "var(--t2)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span className="d o" />
                    Reviewer approved this post, but it has no valid linked supporting fact in the registry.
                  </div>
                )}

                {/* Card footer audit meta */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    fontSize: 12,
                    fontFamily: "var(--mono)",
                    color: "var(--t3)",
                    borderTop: "1px solid var(--line)",
                    paddingTop: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <span>Post ID: {p.id}</span>
                  <span>Living audit: Synchronized with browser memory</span>
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
