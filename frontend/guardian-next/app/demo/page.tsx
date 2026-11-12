"use client";

import { useState } from "react";
import Link from "next/link";
import IssueCard from "@/components/IssueCard";
import { mockAnalyze } from "@/lib/mock";

type Resolution = "applied" | "dismissed";

export default function PublicDemoPage() {
  const [draft, setDraft] = useState(mockAnalyze.content);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [activeId, setActiveId] = useState(mockAnalyze.issues[0]?.id ?? "");

  const issues = mockAnalyze.issues;
  const resolvedCount = Object.keys(resolutions).length;
  const remainingCount = issues.length - resolvedCount;

  function applyFix(issueId: string) {
    const issue = issues.find((item) => item.id === issueId);
    if (!issue || !issue.suggested_fix) return;

    setDraft((current) =>
      current.replace(issue.flagged_text, issue.suggested_fix!)
    );

    setResolutions((current) => ({
      ...current,
      [issueId]: "applied",
    }));
  }

  function dismissIssue(issueId: string) {
    setResolutions((current) => ({
      ...current,
      [issueId]: "dismissed",
    }));
  }

  function resetDemo() {
    setDraft(mockAnalyze.content);
    setResolutions({});
    setActiveId(mockAnalyze.issues[0]?.id ?? "");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--ink)",
        color: "var(--t1)",
      }}
    >
      {/* ─── Top Navbar matching Home page ─── */}
      <div className="bar">
        <div className="wrap">
          <nav>
            <Link className="logo" href="/" aria-label="Guardian AI">
              <svg width="24" height="24" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="2" y="3" width="9" height="3" rx="1.5" fill="#e0343c" />
                <rect x="2" y="8.5" width="16" height="3" rx="1.5" fill="#f7ece8" />
                <rect x="2" y="14" width="12" height="3" rx="1.5" fill="#f7ece8" opacity=".5" />
              </svg>
              Guardian AI
            </Link>
            <div className="nl">
              <Link className="h" href="/">
                Home
              </Link>
              <Link className="h" href="/ledger">
                Ledger
              </Link>
              <Link className="h" href="/menu">
                Menu
              </Link>
              <Link className="h" href="/login">
                Admin
              </Link>
              <button
                type="button"
                onClick={resetDemo}
                className="pill ghost"
                style={{ height: 38, fontSize: 13, padding: "0 18px", cursor: "pointer" }}
              >
                Reset demo
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* ─── Main Content Container ─── */}
      <main className="wrap" style={{ paddingTop: 112, paddingBottom: 96 }}>
        {/* Notice Banner */}
        <div
          style={{
            background: "var(--s1)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: "20px 24px",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              color: "var(--redhi)",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "var(--mono)",
              marginBottom: 6,
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            Public interactive demo · Sample draft
          </div>
          <p style={{ color: "var(--t2)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
            Review sample marketing draft claims against deterministic policies and AI citations.
            Apply or dismiss findings to observe in-place source alignment.
          </p>
        </div>

        {/* Title Section */}
        <section style={{ marginBottom: 40 }}>
          <p className="kick">Interactive walkthrough</p>
          <h1
            style={{
              fontSize: "clamp(36px, 5.5vw, 68px)",
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
              maxWidth: "18ch",
            }}
          >
            Review claims tied to approved sources
          </h1>
          <p
            className="lead"
            style={{
              fontSize: "clamp(16px, 1.6vw, 20px)",
              maxWidth: 640,
              margin: 0,
            }}
          >
            Deterministic checks catch banned terms and competitor names instantly. AI citations verify claims against your brand policies.
          </p>
        </section>

        {/* Stats Row */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: "22px 24px",
            }}
          >
            <div style={{ color: "var(--t3)", fontSize: 13, fontFamily: "var(--mono)" }}>
              Total findings
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 500,
                fontFamily: "var(--mono)",
                color: "var(--t1)",
                marginTop: 8,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {issues.length}
            </div>
          </div>

          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: "22px 24px",
            }}
          >
            <div style={{ color: "var(--t3)", fontSize: 13, fontFamily: "var(--mono)" }}>
              Resolved locally
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 500,
                fontFamily: "var(--mono)",
                color: "var(--redhi)",
                marginTop: 8,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {resolvedCount}
            </div>
          </div>

          <div
            style={{
              background: "var(--s1)",
              border: "1px solid var(--line)",
              borderRadius: 18,
              padding: "22px 24px",
            }}
          >
            <div style={{ color: "var(--t3)", fontSize: 13, fontFamily: "var(--mono)" }}>
              Remaining findings
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 500,
                fontFamily: "var(--mono)",
                color: remainingCount > 0 ? "var(--yellow)" : "#10b981",
                marginTop: 8,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {remainingCount}
            </div>
          </div>
        </section>

        {/* Sample Draft Box */}
        <section
          style={{
            background: "var(--s1)",
            border: "1px solid var(--line)",
            borderRadius: 24,
            padding: 28,
            marginBottom: 44,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 500, margin: 0, color: "var(--t1)" }}>
                Sample marketing draft
              </h2>
              <p
                style={{
                  color: "var(--t3)",
                  fontSize: 12,
                  fontFamily: "var(--mono)",
                  margin: "4px 0 0",
                }}
              >
                Draft ID: {mockAnalyze.draft_id}
              </p>
            </div>

            <div
              className="chip"
              style={{
                background: "rgba(244, 236, 230, 0.06)",
                fontFamily: "var(--mono)",
              }}
            >
              <span className="d y" />
              Sample · In review
            </div>
          </div>

          <div
            style={{
              background: "var(--s2)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              padding: 22,
              color: "var(--t1)",
              lineHeight: 1.8,
              fontSize: 15,
              whiteSpace: "pre-wrap",
            }}
          >
            {draft}
          </div>
        </section>

        {/* Review Findings Section */}
        <section style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: "clamp(24px, 3.5vw, 36px)",
                  fontWeight: 500,
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Review findings
              </h2>
              <p style={{ color: "var(--t2)", fontSize: 14, margin: "6px 0 0" }}>
                Select a finding to inspect cited policy passages and apply deterministic fixes.
              </p>
            </div>

            <button
              type="button"
              onClick={resetDemo}
              className="pill ghost"
              style={{ height: 38, fontSize: 13, cursor: "pointer" }}
            >
              Reset draft
            </button>
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                active={activeId === issue.id}
                resolved={resolutions[issue.id]}
                canApply={
                  Boolean(issue.suggested_fix) &&
                  issue.severity !== "ACCESSIBILITY" &&
                  issue.category !== "MISSING_ALT_TEXT" &&
                  Boolean(issue.flagged_text) &&
                  draft.includes(issue.flagged_text)
                }
                onSelect={() => setActiveId(issue.id)}
                onApply={() => applyFix(issue.id)}
                onDismiss={() => dismissIssue(issue.id)}
              />
            ))}
          </div>
        </section>

        {/* Human Decides Banner */}
        <section
          style={{
            background: "var(--deep)",
            border: "1px solid var(--line)",
            borderRadius: 20,
            padding: 32,
            marginBottom: 48,
          }}
        >
          <h3
            style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              margin: "0 0 10px",
              color: "var(--t1)",
            }}
          >
            A human always decides
          </h3>
          <p
            style={{
              color: "var(--t2)",
              fontSize: 15,
              lineHeight: 1.7,
              margin: 0,
              maxWidth: 620,
            }}
          >
            Guardian flags and suggests. A reviewer approves every modification, and each decision is recorded into an append-only audit log.
          </p>
          <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link className="pill light" href="/ledger">
              Inspect Living Ledger
            </Link>
            <Link className="pill ghost" href="/login">
              Team login
            </Link>
          </div>
        </section>

        {/* Demo Footer */}
        <footer
          style={{
            borderTop: "1px solid var(--line)",
            paddingTop: 28,
            color: "var(--t3)",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>Guardian AI · Living Claim Ledger</div>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/" style={{ color: "var(--t1)" }}>
              Home
            </Link>
            <Link href="/ledger" style={{ color: "var(--t1)" }}>
              Ledger
            </Link>
            <Link href="/menu" style={{ color: "var(--t1)" }}>
              Menu
            </Link>
            <Link href="/login" style={{ color: "var(--t1)" }}>
              Admin
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
