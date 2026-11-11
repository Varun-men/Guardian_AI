
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import IssueCard from "@/components/IssueCard";
import { useLedger } from "@/lib/ledger-store";
import { mockAnalyze } from "@/lib/mock";
import type { AnalyzeResponse } from "@/lib/types";
import { apiFetch } from "@/lib/api";

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

type AppliedDelta = {
  id: string;
  originalText: string;
  appliedFix: string;
};

function Review({ analysis }: { analysis: AnalyzeResponse }) {
  const { recordDecision } = useLedger();

  const isDemo = analysis.draft_id === "uuid-1234";
  const issues = analysis.issues;

  const [content, setContent] = useState(analysis.content);
  const [active, setActive] = useState<string | null>(
    issues[0]?.id ?? null
  );

  const [resolved, setResolved] = useState<
    Record<string, "applied" | "dismissed">
  >({});

  const [appliedDeltas, setAppliedDeltas] = useState<AppliedDelta[]>([]);
  const [viewMode, setViewMode] = useState<"proof" | "diff" | "clean">("proof");
  const [copied, setCopied] = useState(false);
  const [approved, setApproved] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [decisionsLoaded, setDecisionsLoaded] = useState(isDemo);

  const pending = issues.filter(
    (issue) =>
      issue.needs_human_decision && !resolved[issue.id]
  ).length;

  // Restore previously saved decisions from the backend.
  useEffect(() => {
    if (isDemo) {
      setDecisionsLoaded(true);
      return;
    }

    let cancelled = false;

    async function loadDecisions() {
      try {
        const data = await apiFetch(
          `/api/review/${encodeURIComponent(analysis.draft_id)}/decisions`
        );

        if (cancelled) return;

        const restored: Record<string, "applied" | "dismissed"> = {};

        for (const [id, decision] of Object.entries(
          data.decisions ?? {}
        )) {
          if (decision === "applied" || decision === "dismissed") {
            restored[id] = decision;
          }
        }

        setResolved(restored);
        setDecisionsLoaded(true);
        setActionError(null);
      } catch (error) {
        if (!cancelled) {
          setActionError(
            error instanceof Error
              ? error.message
              : "Could not restore saved decisions."
          );
          setDecisionsLoaded(false);
        }
      }
    }

    loadDecisions();

    return () => {
      cancelled = true;
    };
  }, [analysis.draft_id, isDemo]);

  // Apply a suggested fix and save the decision.
  const apply = async (id: string) => {
    if (saving) return;

    const issue = issues.find((item) => item.id === id);

    if (!issue?.suggested_fix || !issue.flagged_text) {
      setActionError("No valid suggested fix is available.");
      return;
    }

    if (resolved[id]) {
      setActionError("This finding has already been resolved.");
      return;
    }

    const occurrences = content.split(issue.flagged_text).length - 1;

    if (occurrences === 0) {
      setActionError(
        "The original flagged text was not found. It may already have been replaced."
      );
      return;
    }

    setSaving(true);

    try {
      if (!isDemo) {
        await apiFetch(
          `/api/review/findings/${encodeURIComponent(id)}/decision`,
          {
            method: "POST",
            body: JSON.stringify({ decision: "applied" }),
          }
        );
      }

      const index = content.indexOf(issue.flagged_text);

      const updatedContent =
        content.slice(0, index) +
        issue.suggested_fix +
        content.slice(index + issue.flagged_text.length);

      setContent(updatedContent);

      setAppliedDeltas((prev) => [
        ...prev.filter((item) => item.id !== id),
        {
          id,
          originalText: issue.flagged_text,
          appliedFix: issue.suggested_fix!,
        },
      ]);

      setResolved((prev) => ({
        ...prev,
        [id]: "applied",
      }));

      recordDecision("applied");

      setActionError(
        occurrences > 1
          ? "The first matching occurrence was updated. Review the remaining occurrences manually."
          : null
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not save the decision."
      );
    } finally {
      setSaving(false);
    }
  };

  // Dismiss a finding and save the decision.
  const dismiss = async (id: string) => {
    if (saving || resolved[id]) return;

    setSaving(true);

    try {
      if (!isDemo) {
        await apiFetch(
          `/api/review/findings/${encodeURIComponent(id)}/decision`,
          {
            method: "POST",
            body: JSON.stringify({ decision: "dismissed" }),
          }
        );
      }

      setResolved((prev) => ({
        ...prev,
        [id]: "dismissed",
      }));

      recordDecision("dismissed");
      setActionError(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not save the decision."
      );
    } finally {
      setSaving(false);
    }
  };

  // Batch action: accept all high-confidence fixes.
  const applyAllSafeFixes = async () => {
    if (saving) return;

    const targets = issues.filter(
      (issue) =>
        issue.suggested_fix &&
        issue.confidence >= 0.75 &&
        !resolved[issue.id] &&
        content.includes(issue.flagged_text)
    );

    if (targets.length === 0) {
      setActionError("No pending high-confidence fixes available.");
      return;
    }

    setSaving(true);

    try {
      if (!isDemo) {
        await Promise.all(
          targets.map((issue) =>
            apiFetch(
              `/api/review/findings/${encodeURIComponent(issue.id)}/decision`,
              {
                method: "POST",
                body: JSON.stringify({ decision: "applied" }),
              }
            )
          )
        );
      }

      let newContent = content;
      const newDeltas = [...appliedDeltas];
      const newResolved = { ...resolved };
      let count = 0;

      for (const issue of targets) {
        const index = newContent.indexOf(issue.flagged_text);

        if (index < 0) continue;

        newContent =
          newContent.slice(0, index) +
          issue.suggested_fix! +
          newContent.slice(index + issue.flagged_text.length);

        newDeltas.push({
          id: issue.id,
          originalText: issue.flagged_text,
          appliedFix: issue.suggested_fix!,
        });

        newResolved[issue.id] = "applied";
        recordDecision("applied");
        count++;
      }

      setContent(newContent);
      setAppliedDeltas(newDeltas);
      setResolved(newResolved);

      setActionError(
        `Applied ${count} high-confidence fix${count === 1 ? "" : "es"} across the draft.`
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not save batch decisions. Reload saved decisions before retrying."
      );
    } finally {
      setSaving(false);
    }
  };

  // Batch action: dismiss informational findings.
  const dismissNonCritical = async () => {
    if (saving) return;

    const targets = issues.filter(
      (issue) =>
        !issue.needs_human_decision &&
        !resolved[issue.id]
    );

    if (targets.length === 0) {
      setActionError("No pending informational checks to dismiss.");
      return;
    }

    setSaving(true);

    try {
      if (!isDemo) {
        await Promise.all(
          targets.map((issue) =>
            apiFetch(
              `/api/review/findings/${encodeURIComponent(issue.id)}/decision`,
              {
                method: "POST",
                body: JSON.stringify({ decision: "dismissed" }),
              }
            )
          )
        );
      }

      const newResolved = { ...resolved };

      for (const issue of targets) {
        newResolved[issue.id] = "dismissed";
        recordDecision("dismissed");
      }

      setResolved(newResolved);

      setActionError(
        `Dismissed ${targets.length} informational check${targets.length === 1 ? "" : "s"}.`
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not save batch decisions. Reload saved decisions before retrying."
      );
    } finally {
      setSaving(false);
    }
  };

  // Copy clean copy to clipboard.
  const copyCleanText = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setActionError("Could not access clipboard. Please copy manually.");
    }
  };

  // Approve only after all required decisions are complete.
  const approve = async () => {
    if (pending > 0 || approved || saving || !decisionsLoaded) return;

    if (isDemo) {
      setActionError("Sample demo drafts cannot be approved in the database.");
      return;
    }

    setSaving(true);

    try {
      await apiFetch(
        `/api/review/${encodeURIComponent(analysis.draft_id)}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        }
      );

      setApproved(true);
      setActionError(null);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Approval failed."
      );
    } finally {
      setSaving(false);
    }
  };

  // Keyboard navigation shortcuts.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ["INPUT", "TEXTAREA"].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        return;
      }

      const currentIndex = issues.findIndex(
        (issue) => issue.id === active
      );

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();

        const next = issues[(currentIndex + 1) % issues.length];

        if (next) setActive(next.id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();

        const prev =
          issues[
            (currentIndex - 1 + issues.length) % issues.length
          ];

        if (prev) setActive(prev.id);
      } else if ((e.key === "a" || e.key === "A") && active) {
        void apply(active);
      } else if ((e.key === "d" || e.key === "D") && active) {
        void dismiss(active);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, issues, content, resolved, saving]);

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

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      {/* Top Header & Primary Status */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-display)]">
            Review Draft & Proof Sheet
          </h1>

          <p className="text-sm text-[#a1a1aa] mt-1 flex items-center gap-2 flex-wrap">
            <span>{issues.length} total findings</span>
            <span className="text-[#71717a]">•</span>

            <span
              className={
                pending > 0
                  ? "text-[#ff9500] font-semibold"
                  : "text-[#10b981] font-semibold"
              }
            >
              {pending > 0
                ? `${pending} decision required`
                : "All decisions complete ✓"}
            </span>

            <span className="text-[#71717a]">•</span>

            <span className="text-xs text-[#a1a1aa]">
              Keyboard:{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px]">
                J
              </kbd>
              /
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px]">
                K
              </kbd>{" "}
              navigate,{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px]">
                A
              </kbd>{" "}
              apply,{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[11px]">
                D
              </kbd>{" "}
              dismiss
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyCleanText}
            className="btn"
            style={{
              borderColor: copied ? "#10b981" : "rgba(255,107,0,0.3)",
              color: copied ? "#10b981" : "#ffffff",
              background: copied
                ? "rgba(16,185,129,0.12)"
                : "rgba(255,107,0,0.06)",
            }}
          >
            {copied ? (
              <>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                ✓ Copied to Clipboard
              </>
            ) : (
              <>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <rect
                    x="9"
                    y="9"
                    width="13"
                    height="13"
                    rx="2"
                    ry="2"
                  />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy Clean Copy
              </>
            )}
          </button>

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
              disabled={
                pending > 0 ||
                saving ||
                !decisionsLoaded ||
                isDemo
              }
              onClick={() => void approve()}
            >
              {saving
                ? "Saving..."
                : isDemo
                  ? "Demo — Approval Disabled"
                  : !decisionsLoaded
                    ? "Loading Decisions..."
                    : "Approve Post to Ledger"}
            </button>
          )}
        </div>
      </header>

      {/* Batch Operations Toolbar */}
      <div className="panel p-3.5 flex flex-wrap items-center justify-between gap-3 border border-[#ff6b00]/20 bg-[#ff6b00]/5 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1aa]">
          <span className="w-2 h-2 rounded-full bg-[#ff6b00]" />
          <span className="font-bold text-white uppercase tracking-wider">
            Quick Actions:
          </span>
          <span>
            Batch apply verified suggestions or clear informational items
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void applyAllSafeFixes()}
            disabled={saving}
            className="btn text-xs px-3 py-1.5 h-auto font-semibold border-[#ff6b00]/30 hover:border-[#ff6b00] text-[#ff6b00]"
          >
            ⚡ Accept All Safe Fixes
          </button>

          <button
            type="button"
            onClick={() => void dismissNonCritical()}
            disabled={saving}
            className="btn text-xs px-3 py-1.5 h-auto text-[#a1a1aa] hover:text-white"
          >
            Dismiss Informational
          </button>
        </div>
      </div>

      {actionError && (
        <div
          role="status"
          className="rounded-lg border border-[#ff9500]/40 bg-[#ff9500]/10 p-3 text-sm text-[#ff9500] flex items-center justify-between"
        >
          <span>{actionError}</span>

          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs text-[#ff9500] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Review Columns */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)]">
        {/* Left Column: Draft Review / Diff Sheet */}
        <section
          className="panel p-6 flex flex-col gap-5 h-fit border border-[#ff6b00]/18 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          aria-label="Draft"
        >
          {/* View Mode Selector Tabs */}
          <div className="flex items-center justify-between border-b border-[#ff6b00]/15 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setViewMode("proof")}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  viewMode === "proof"
                    ? "bg-[#ff6b00] text-black shadow-[0_0_10px_rgba(255,107,0,0.35)]"
                    : "text-[#a1a1aa] hover:text-white"
                }`}
              >
                Proof Sheet
              </button>

              <button
                type="button"
                onClick={() => setViewMode("diff")}
                className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "diff"
                    ? "bg-[#ff6b00] text-black shadow-[0_0_10px_rgba(255,107,0,0.35)]"
                    : "text-[#a1a1aa] hover:text-white"
                }`}
              >
                <span>Visual Diff</span>

                {appliedDeltas.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black text-[#ff6b00]">
                    {appliedDeltas.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewMode("clean")}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  viewMode === "clean"
                    ? "bg-[#ff6b00] text-black shadow-[0_0_10px_rgba(255,107,0,0.35)]"
                    : "text-[#a1a1aa] hover:text-white"
                }`}
              >
                Clean Copy
              </button>
            </div>

            <span className="text-xs text-[#71717a] font-mono">
              {content.split(/\s+/).filter(Boolean).length} words ·{" "}
              {content.length} chars
            </span>
          </div>

          {/* MODE 1: Interactive Proof Sheet */}
          {viewMode === "proof" && (
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
                      onClick={() => setActive(segment.issue!.id)}
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
                      onClick={() => setActive(segment.issue!.id)}
                      title={`Jump to finding #${issues.indexOf(segment.issue) + 1}`}
                    >
                      {issues.indexOf(segment.issue) + 1}
                    </span>{" "}
                  </span>
                ) : (
                  <span key={index}>{segment.text}</span>
                )
              )}
            </div>
          )}

          {/* MODE 2: Visual Diff View */}
          {viewMode === "diff" && (
            <div className="flex flex-col gap-4">
              {appliedDeltas.length === 0 ? (
                <div className="p-8 text-center text-sm text-[#a1a1aa] bg-black/30 rounded-xl border border-dashed border-white/10">
                  <p className="font-semibold text-white">
                    No fixes applied yet
                  </p>
                  <p className="text-xs mt-1 text-[#71717a]">
                    Click &ldquo;Apply fix&rdquo; or &ldquo;Accept All Safe
                    Fixes&rdquo; to see the side-by-side delta between
                    original draft copy and verified revisions.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-sm leading-relaxed">
                    <div className="text-xs font-mono font-bold uppercase text-[#ff6b00] mb-2">
                      Inline Delta Highlights:
                    </div>

                    <div className="text-white space-y-2">
                      {appliedDeltas.map((delta) => (
                        <div
                          key={delta.id}
                          className="p-2.5 rounded bg-black/60 border border-white/5 text-xs font-mono flex flex-col gap-1"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-red-400 font-bold">
                              − BEFORE:
                            </span>

                            <del className="line-through text-red-300 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-500/20">
                              {delta.originalText}
                            </del>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">
                              + AFTER:
                            </span>

                            <ins className="no-underline text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                              {delta.appliedFix}
                            </ins>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 text-sm leading-relaxed">
                    <div className="text-xs font-mono font-bold uppercase text-emerald-400 mb-2">
                      Resulting Revised Copy:
                    </div>

                    <p className="text-white m-0">{content}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: Clean Copy View */}
          {viewMode === "clean" && (
            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-sm text-white leading-relaxed">
                {content}
              </div>

              <div className="flex items-center justify-between text-xs text-[#a1a1aa] px-1">
                <span>
                  Clean presentation without marks or annotations.
                </span>

                <button
                  type="button"
                  onClick={copyCleanText}
                  className="text-[#ff6b00] hover:underline font-bold"
                >
                  {copied ? "✓ Copied" : "Copy text"}
                </button>
              </div>
            </div>
          )}

          {/* Non-textual or missing alt-tag findings */}
          {issues
            .filter((issue) => !content.includes(issue.flagged_text))
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

                  <span className="text-xs text-[#71717a]">•</span>

                  <span className="text-xs text-[#ff9500]">
                    {issue.category.toLowerCase().replace(/_/g, " ")}
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
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#a1a1aa] px-1">
            <span>Finding Details & Citations ({issues.length})</span>
            <span>Click card or press 1-{issues.length}</span>
          </div>

          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              active={active === issue.id}
              resolved={resolved[issue.id]}
              onSelect={() => setActive(issue.id)}
              onApply={() => void apply(issue.id)}
              onDismiss={() => void dismiss(issue.id)}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
