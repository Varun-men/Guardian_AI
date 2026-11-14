"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type LedgerFact = {
  id: number;
  name: string;
  value: string;
  source_id: number;
  source_name: string | null;
  source_version: string | null;
};

type LedgerEntry = {
  id: string;
  claim_id: number;
  draft_id: string;
  review_id: number;
  title: string;
  text: string;
  draft_content: string;
  claim_status: string;
  status: "current" | "stale" | "unverified";
  ledger_status: string | null;
  fact: LedgerFact | null;
  created_at: string | null;
};

type LedgerResponse = {
  total: number;
  entries: LedgerEntry[];
  facts: Array<{
    id: number;
    label: string;
    value: string;
    version: string | null;
    source_id: number;
    source_name: string | null;
  }>;
};

type Filter = "all" | "stale" | "current" | "unverified";

export default function LedgerPage() {
  const [data, setData] = useState<LedgerResponse | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLedger() {
      try {
        setLoading(true);
        setError(null);

        const result = await apiFetch("/api/ledger/");

        if (!active) return;

        setData({
          total: result.total ?? 0,
          entries: result.entries ?? [],
          facts: result.facts ?? [],
        });
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the Living Claim Ledger."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLedger();

    return () => {
      active = false;
    };
  }, []);

  const posts = data?.entries ?? [];

  const staleCount = posts.filter((post) => post.status === "stale").length;
  const currentCount = posts.filter((post) => post.status === "current").length;
  const unverifiedCount = posts.filter(
    (post) => post.status === "unverified"
  ).length;

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filter === "all") return true;
      return post.status === filter;
    });
  }, [posts, filter]);

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All claims", count: posts.length },
    { id: "stale", label: "Stale drift", count: staleCount },
    { id: "current", label: "Current & linked", count: currentCount },
    { id: "unverified", label: "Unverified", count: unverifiedCount },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 32,
        maxWidth: 1140,
        margin: "0 auto",
      }}
    >
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z"
                fill="#B0121B"
              />
              <path
                d="M11 16l3.5 3.5L21 12"
                stroke="#F7ECE8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--t3)",
                fontWeight: 600,
              }}
            >
              Persistent verification record
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(32px, 4.5vw, 46px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              margin: "0 0 10px",
              color: "var(--t1)",
            }}
          >
            Living Claim Ledger
          </h1>

          <p
            style={{
              color: "var(--t2)",
              fontSize: "16.5px",
              maxWidth: 620,
              margin: 0,
              lineHeight: 1.65,
            }}
          >
            Approved claims remain linked to Registry facts. Changes to
            upstream facts are reflected in the status of linked claims.
          </p>
        </div>

        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 12,
            color: "var(--t3)",
          }}
        >
          {loading ? "Loading records..." : `${posts.length} ledger records`}
        </div>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            background: "var(--s1)",
            border: "1px solid var(--redhi)",
            borderRadius: 16,
            padding: "18px 20px",
            color: "var(--t1)",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
            Could not load the Living Claim Ledger
          </p>
          <p style={{ margin: 0, color: "var(--t2)", fontSize: 13 }}>
            {error}
          </p>
          <p style={{ margin: "10px 0 0", color: "var(--t3)", fontSize: 12 }}>
            Check that you are signed in and the backend is running.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          {staleCount > 0 ? (
            <div
              role="alert"
              style={{
                background: "var(--s1)",
                border: "1px solid var(--redhi)",
                borderRadius: 18,
                padding: "20px 24px",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 500,
                  fontSize: 16,
                  color: "var(--t1)",
                }}
              >
                {staleCount} linked claim{staleCount === 1 ? " is" : "s are"}{" "}
                marked stale
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "var(--t2)",
                }}
              >
                An upstream Registry fact changed. Review these claims before
                publishing updated content.
              </p>
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
              <p
                style={{
                  margin: 0,
                  fontWeight: 500,
                  fontSize: 15,
                  color: "var(--t1)",
                }}
              >
                {unverifiedCount} approved claim
                {unverifiedCount === 1 ? " has" : "s have"} no linked Registry
                fact
              </p>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: "var(--t2)",
                }}
              >
                These claims remain visible in the Ledger but are not treated
                as fact-linked records.
              </p>
            </div>
          ) : posts.length > 0 ? (
            <div
              style={{
                background: "var(--s1)",
                border: "1px solid var(--line)",
                borderRadius: 18,
                padding: "18px 24px",
                color: "var(--t2)",
                fontSize: 14,
              }}
            >
              All returned claims are linked to Registry facts and currently
              marked as synchronized.
            </div>
          ) : null}

          <div
            className="tabs"
            role="tablist"
            aria-label="Filter claims by ledger status"
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                onClick={() => setFilter(item.id)}
                className="tab"
                style={{
                  fontFamily: "var(--mono)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{item.label}</span>
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: 999,
                    fontSize: 11,
                    background:
                      filter === item.id
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,226,220,0.06)",
                  }}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {filteredPosts.length === 0 ? (
              <div
                style={{
                  background: "var(--s1)",
                  border: "1px solid var(--line)",
                  borderRadius: 24,
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontWeight: 500,
                    fontSize: 18,
                    color: "var(--t1)",
                    margin: "0 0 10px",
                  }}
                >
                  {posts.length === 0
                    ? "No approved claims in the Ledger yet"
                    : `No claims matching "${filter}"`}
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: "var(--t3)",
                    maxWidth: 460,
                    margin: "0 auto",
                    lineHeight: 1.6,
                  }}
                >
                  {posts.length === 0
                    ? "Analyze a draft, link its claims to Registry facts, and approve it to create persistent Ledger records."
                    : "Try another status filter to see more Ledger records."}
                </p>
                {filter !== "all" && posts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className="pill ghost"
                    style={{ height: 36, fontSize: 13, marginTop: 16 }}
                  >
                    Show all claims
                  </button>
                )}
              </div>
            ) : (
              filteredPosts.map((post) => {
                const stale = post.status === "stale";
                const unverified = post.status === "unverified";
                const fact = post.fact;

                return (
                  <section
                    key={post.id}
                    className="mc"
                    style={{
                      background: "var(--s1)",
                      border: `1px solid ${
                        stale ? "var(--redhi)" : "var(--line)"
                      }`,
                      borderRadius: 24,
                      padding: 28,
                      display: "flex",
                      flexDirection: "column",
                      gap: 18,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: 19,
                            fontWeight: 500,
                            margin: 0,
                            color: "var(--t1)",
                          }}
                        >
                          {post.title}
                        </h2>

                        <div className="chip">
                          <span
                            className={`d ${
                              stale ? "y" : unverified ? "o" : ""
                            }`}
                            style={{
                              background:
                                !stale && !unverified ? "#10b981" : undefined,
                            }}
                          />
                          {stale
                            ? "Stale"
                            : unverified
                              ? "Unverified"
                              : "Current"}
                        </div>
                      </div>

                      {fact && (
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: "var(--mono)",
                            color: "var(--t3)",
                          }}
                        >
                          Linked Fact:{" "}
                          <strong
                            style={{
                              color: "var(--redhi)",
                              fontWeight: 500,
                            }}
                          >
                            {fact.name}
                          </strong>{" "}
                          ({fact.value} · v{fact.source_version ?? "unknown"})
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        background: "var(--s2)",
                        border: "1px solid var(--line)",
                        borderRadius: 16,
                        padding: 20,
                        fontSize: 15,
                        lineHeight: 1.7,
                        color: "var(--t1)",
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {post.text}
                    </div>

                    {stale && fact && (
                      <div
                        style={{
                          background: "var(--s2)",
                          border: "1px solid var(--line)",
                          borderRadius: 16,
                          padding: 18,
                          fontSize: 13,
                          lineHeight: 1.6,
                          color: "var(--t2)",
                        }}
                      >
                        This claim is linked to a Registry fact that has
                        changed. The approved claim has not been silently
                        rewritten. Review the claim and approve a corrected
                        version through the normal workflow.
                      </div>
                    )}

                    {unverified && (
                      <div
                        style={{
                          background: "var(--s2)",
                          border: "1px solid var(--line)",
                          borderRadius: 12,
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "var(--t2)",
                        }}
                      >
                        This approved claim has no valid linked supporting
                        Registry fact.
                      </div>
                    )}

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
                      <span>Claim ID: {post.claim_id}</span>
                      <span>Draft: {post.draft_id}</span>
                      <span>
                        Source: {fact?.source_name ?? "Not linked"}
                      </span>
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </>
      )}

      {loading && (
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--line)",
            borderRadius: 18,
            padding: 32,
            textAlign: "center",
            color: "var(--t2)",
            fontSize: 14,
          }}
        >
          Loading persistent Ledger records...
        </div>
      )}
    </div>
  );
}
