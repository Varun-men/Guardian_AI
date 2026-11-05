"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import IssueCard from "@/components/IssueCard";
import { useLedger } from "@/lib/ledger-store";
import { mockAnalyze } from "@/lib/mock";
import type { AnalyzeResponse } from "@/lib/types";

export default function ReviewPage() {
  const { analysis, setAnalysis } = useLedger();

  if (!analysis) {
    return (
      <div className="panel p-8 max-w-xl flex flex-col gap-4 border border-[#ff6b00]/25">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/10 border border-[#ff6b00]/30 flex items-center justify-center text-[#ff6b00]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5l8-3z" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">
              Nothing to review yet
            </h1>
            <p className="text-[#a1a1aa] text-sm">
              Analyze draft copy to inspect findings and check citations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <Link href="/analyze" className="btn btn-primary">
            Analyze a draft
          </Link>

          <button
            onClick={() => setAnalysis(mockAnalyze)}
            className="btn"
            style={{
              color: "#ff9500",
              borderColor: "rgba(255,149,0,0.35)",
            }}
          >
            Load sample demo draft
          </button>
        </div>
      </div>
    );
  }

  return <Review analysis={analysis} />;
}

function Review({ analysis }: { analysis: AnalyzeResponse }) {
  const { approveDraft, recordDecision } = useLedger();

  const issues = analysis.issues;

  const [content, setContent] = useState(analysis.content);
  const [active, setActive] = useState<string | null>(
    issues[0]?.id ?? null
  );

  const [resolved, setResolved] = useState<
    Record<string, "applied" | "dismissed">
  >({});

  const [approved, setApproved] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const pending = issues.filter(
    (issue) =>
      issue.needs_human_decision && !resolved[issue.id]
  ).length;

  // Highlight flagged text in the draft preview.
  const segments = useMemo(() => {
    const hits = issues
      .map((issue) => ({
        issue,
        at: content.indexOf(issue.flagged_text),
      }))
      .filter((hit) => hit.at >= 0)
      .sort((a, b) => a.at - b.at);

    const output: {
      text: string;
      issue?: (typeof issues)[number];
    }[] = [];

    let currentPosition = 0;

    for (const { issue, at } of hits) {
      if (at < currentPosition) continue;

      if (at > currentPosition) {
        output.push({
          text: content.slice(currentPosition, at),
        });
      }

      output.push({
        text: issue.flagged_text,
        issue,
      });

      currentPosition = at + issue.flagged_text.length;
    }

    if (currentPosition < content.length) {
      output.push({
        text: content.slice(currentPosition),
      });
    }

    return output;
  }, [content, issues]);

  // Apply the suggested fix to the first exact matching occurrence.
  const apply = (id: string) => {
    const issue = issues.find((item) => item.id === id);

    if (!issue?.suggested_fix) {
      setActionError(
        "No suggested fix is available for this finding."
      );
      return;
    }

    if (!issue.flagged_text) {
      setActionError(
        "The flagged text is empty. The fix cannot be applied."
      );
      return;
    }

    const occurrences =
      content.split(issue.flagged_text).length - 1;

    if (occurrences === 0) {
      setActionError(
        "The original flagged text was not found. The fix was not applied."
      );
      return;
    }

    const index = content.indexOf(issue.flagged_text);

    const updatedContent =
      content.slice(0, index) +
      issue.suggested_fix +
      content.slice(index + issue.flagged_text.length);

    setContent(updatedContent);

    setResolved((current) => ({
      ...current,
      [id]: "applied",
    }));

    recordDecision("applied");

    setActionError(
      occurrences > 1
        ? "The first matching occurrence was updated. Review the remaining occurrences manually."
        : null
    );
  };

  // Dismiss a finding after human review.
  const dismiss = (id: string) => {
    setResolved((current) => ({
      ...current,
      [id]: "dismissed",
    }));

    recordDecision("dismissed");
    setActionError(null);
  };

  // Approve only after all required human decisions are complete.
  const approve = () => {
    if (pending > 0 || approved) return;

    approveDraft(content, issues);
    setApproved(true);
    setActionError(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-display)]">
            Review draft
          </h1>

          <p className="text-sm text-[#a1a1aa] mt-1 flex items-center gap-2">
            <span>{issues.length} findings</span>

            <span className="text-[#71717a]">•</span>

            <span
              className={
                pending > 0
                  ? "text-[#ff9500] font-semibold"
                  : "text-[#10b981]"
              }
            >
              {pending} need your decision
            </span>
          </p>
        </div>

        {approved ? (
          <Link
            href="/ledger"
            className="btn btn-primary"
            style={{
              background:
                "linear-gradient(135deg, #d44a00 0%, #ff6b00 100%)",
              color: "#ffffff",
              boxShadow: "0 0 20px rgba(255,107,0,0.45)",
            }}
          >
            Approved ✓ Open Living Ledger
          </Link>
        ) : (
          <button
            className="btn btn-primary"
            disabled={pending > 0}
            onClick={approve}
          >
            Approve post
          </button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Left Column: Draft Review */}
        <section
          className="panel p-6 flex flex-col gap-5 h-fit border border-[#ff6b00]/18 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          aria-label="Draft"
        >
          <div className="flex items-center justify-between border-b border-[#ff6b00]/15 pb-3">
            <h2 className="text-xs uppercase tracking-wider font-mono font-bold text-[#a1a1aa]">
              Draft Preview
            </h2>

            <span className="text-xs text-[#71717a] font-mono">
              Interactive Proof Sheet
            </span>
          </div>

          <div className="text-base text-white leading-relaxed p-4 rounded-xl bg-black/40 border border-white/5">
            {segments.map((segment, index) =>
              segment.issue ? (
                <span key={index} className="inline">
                  <mark
                    tabIndex={0}
                    role="button"
                    className={`claim tone-${segment.issue.severity.toLowerCase()} ${
                      active === segment.issue.id
                        ? "active ring-2 ring-[#ff6b00]/70 px-1 py-0.5 rounded"
                        : ""
                    }`}
                    onClick={() =>
                      setActive(segment.issue!.id)
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();
                        setActive(segment.issue!.id);
                      }
                    }}
                  >
                    {segment.text}
                  </mark>

                  <span
                    className="no cursor-pointer transition-transform hover:scale-110"
                    onClick={() =>
                      setActive(segment.issue!.id)
                    }
                  >
                    {issues.indexOf(segment.issue) + 1}
                  </span>{" "}
                </span>
              ) : (
                <span key={index}>{segment.text}</span>
              )
            )}
          </div>

          {/* Non-textual or missing alt-tag findings */}
          {issues
            .filter(
              (issue) => !content.includes(issue.flagged_text)
            )
            .map((issue) => (
              <div
                key={issue.id}
                onClick={() => setActive(issue.id)}
                className={`p-3 rounded-lg border text-sm flex items-center justify-between cursor-pointer transition-colors ${
                  active === issue.id
                    ? "border-[#ff6b00] bg-[#ff6b00]/10"
                    : "border-white/5 bg-black/30 hover:border-[#ff6b00]/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#a1a1aa]">
                    {issue.flagged_text}
                  </span>

                  <span className="text-xs text-[#71717a]">
                    •
                  </span>

                  <span className="text-xs text-[#ff9500]">
                    {issue.category
                      .toLowerCase()
                      .replace(/_/g, " ")}
                  </span>
                </div>

                <span className="no">
                  {issues.indexOf(issue) + 1}
                </span>
              </div>
            ))}
        </section>

        {/* Right Column: Finding Cards */}
        <section
          className="flex flex-col gap-4"
          aria-label="Findings"
        >
          {actionError && (
            <p
              role="status"
              className="rounded-lg border border-[#ff9500]/30 bg-[#ff9500]/10 p-3 text-sm text-[#ff9500]"
            >
              {actionError}
            </p>
          )}

          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              active={active === issue.id}
              resolved={resolved[issue.id]}
              onSelect={() => setActive(issue.id)}
              onApply={() => apply(issue.id)}
              onDismiss={() => dismiss(issue.id)}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
