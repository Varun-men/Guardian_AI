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
    <main
      style={{
        minHeight: "100vh",
        background: "#080809",
        color: "#fff",
        padding: "32px 20px 64px",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 32,
          }}
        >
          <Link
            href="/"
            style={{
              color: "#fff",
              textDecoration: "none",
              fontWeight: 800,
              letterSpacing: 1.5,
            }}
          >
            GUARDIAN AI
            <span
              style={{
                display: "block",
                color: "#ff6b00",
                fontSize: 10,
                letterSpacing: 2,
                marginTop: 4,
              }}
            >
              LIVING CLAIM LEDGER
            </span>
          </Link>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link
              href="/"
              style={{
                color: "#a1a1aa",
                textDecoration: "none",
                fontSize: 13,
              }}
            >
              Back to home
            </Link>
            <Link
              href="/login"
              style={{
                color: "#fff",
                textDecoration: "none",
                border: "1px solid #393939",
                borderRadius: 8,
                padding: "9px 14px",
                fontSize: 13,
              }}
            >
              Team login
            </Link>
          </div>
        </header>

        <section
          style={{
            border: "1px solid rgba(255,107,0,.35)",
            background: "rgba(255,107,0,.07)",
            borderRadius: 12,
            padding: "15px 18px",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              color: "#ff9a50",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 1.5,
              marginBottom: 6,
            }}
          >
            PUBLIC INTERACTIVE DEMO · SAMPLE DATA
          </div>
          <p style={{ color: "#d4d4d8", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            Explore a sample claim review. Apply and dismiss actions change
            this page locally only. No backend requests, production records,
            or real approvals are performed.
          </p>
        </section>

        <section style={{ marginBottom: 30 }}>
          <p
            style={{
              color: "#ff8a35",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2,
              marginBottom: 10,
            }}
          >
            INTERACTIVE WALKTHROUGH
          </p>
          <h1
            style={{
              fontFamily: "var(--font-display), sans-serif",
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.1,
              margin: "0 0 12px",
            }}
          >
            Review claims.
            <span style={{ color: "#ff6b00" }}> Protect trust.</span>
          </h1>
          <p style={{ color: "#a1a1aa", maxWidth: 680, lineHeight: 1.7 }}>
            See how Guardian AI identifies risky claims, connects them to
            evidence, and suggests safer content revisions.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            { label: "Total findings", value: issues.length },
            { label: "Resolved locally", value: resolvedCount },
            { label: "Remaining", value: remainingCount },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: 18,
                border: "1px solid #29292d",
                background: "#101012",
                borderRadius: 12,
              }}
            >
              <div style={{ color: "#92929b", fontSize: 12 }}>
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 29,
                  fontWeight: 700,
                  marginTop: 7,
                  color: "#ff8a35",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </section>

        <section
          style={{
            border: "1px solid #29292d",
            background: "#101012",
            borderRadius: 14,
            padding: 20,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: 17, margin: 0 }}>Sample draft</h2>
              <p style={{ color: "#85858e", fontSize: 12, margin: "5px 0 0" }}>
                Draft ID: {mockAnalyze.draft_id}
              </p>
            </div>
            <span
              style={{
                color: "#ffb36f",
                background: "rgba(255,107,0,.1)",
                border: "1px solid rgba(255,107,0,.25)",
                borderRadius: 20,
                padding: "6px 10px",
                fontSize: 11,
              }}
            >
              SAMPLE · IN REVIEW
            </span>
          </div>

          <div
            style={{
              background: "#080809",
              border: "1px solid #29292d",
              borderRadius: 10,
              padding: 18,
              color: "#e4e4e7",
              lineHeight: 1.9,
              fontSize: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            {draft}
          </div>
        </section>

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: 20, margin: 0 }}>Review findings</h2>
              <p style={{ color: "#92929b", fontSize: 12, margin: "5px 0 0" }}>
                Select a finding to inspect its evidence and suggested fix.
              </p>
            </div>

            <button
              type="button"
              onClick={resetDemo}
              style={{
                color: "#fff",
                background: "#202024",
                border: "1px solid #393939",
                borderRadius: 8,
                padding: "9px 14px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Reset demo
            </button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                active={activeId === issue.id}
                resolved={resolutions[issue.id]}
                onSelect={() => setActiveId(issue.id)}
                onApply={() => applyFix(issue.id)}
                onDismiss={() => dismissIssue(issue.id)}
              />
            ))}
          </div>
        </section>

        <section
          style={{
            marginTop: 30,
            border: "1px solid #39302a",
            borderRadius: 12,
            padding: 18,
            background: "rgba(255,255,255,.025)",
          }}
        >
          <h3 style={{ fontSize: 15, margin: "0 0 8px" }}>
            Approval and production actions
          </h3>
          <p style={{ color: "#a1a1aa", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            Approval is unavailable in this public demonstration. No real
            review decision is submitted or saved. The authenticated team
            workflow remains separate.
          </p>
          <button
            type="button"
            disabled
            style={{
              marginTop: 14,
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #444",
              background: "#242428",
              color: "#777",
              cursor: "not-allowed",
            }}
          >
            Approval disabled in public demo
          </button>
        </section>

        <footer
          style={{
            borderTop: "1px solid #29292d",
            marginTop: 42,
            paddingTop: 20,
            color: "#777",
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>Guardian AI · Public sample environment</span>
          <Link href="/" style={{ color: "#ff8a35", textDecoration: "none" }}>
            Return to homepage
          </Link>
        </footer>
      </div>
    </main>
  );
}
