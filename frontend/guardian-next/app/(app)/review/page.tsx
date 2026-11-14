
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import IssueCard from "@/components/IssueCard";
import { useLedger } from "@/lib/ledger-store";
import { mockAnalyze } from "@/lib/mock";
import type { AnalyzeResponse } from "@/lib/types";
import { apiFetch } from "@/lib/api";

type FactOption = {
  id: string;
  name: string;
  value: string;
  source_id: string;
  source_name: string | null;
  source_version: number;
  source_status: string | null;
};

export default function ReviewPage() {
  const { analysis, setAnalysis } = useLedger();

  if (!analysis) {
    return (
      <div className="panel p-8 max-w-xl flex flex-col gap-4 border border-[var(--blood)]/25">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--blood)]/10 border border-[var(--blood)]/30 flex items-center justify-center text-[var(--blood)]">
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
              color: "var(--redhi)",
              borderColor: "rgba(176,18,27,0.4)",
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

  const [facts, setFacts] = useState<FactOption[]>([]);
  const [selectedFactIds, setSelectedFactIds] = useState<Record<string, string>>({});
  const [associatedFacts, setAssociatedFacts] = useState<Record<string, string>>({});
  const [associatingId, setAssociatingId] = useState<string | null>(null);
  const [associationErrors, setAssociationErrors] = useState<Record<string, string>>({});

    // Load registered Facts for evidence-to-ledger association.
  useEffect(() => {
    if (isDemo) return;

    let cancelled = false;

    apiFetch("/api/facts/")
      .then((data) => {
        if (!cancelled) {
          setFacts(data.facts ?? []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setActionError(
            error instanceof Error ? error.message : "Could not load Facts."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isDemo]);

  const pending = issues.filter(
    (issue) =>
      issue.needs_human_decision && !resolved[issue.id]
  ).length;

    const getEligibleFacts = (issue: (typeof issues)[number]) => {
    if (!issue.source_id || !issue.passage_id ||
        issue.passage_id === "NO_VERIFIED_CITATION") {
      return [];
    }

    const issueVersion = issue.source_version.replace(/^v/i, "");

    return facts.filter(
      (fact) =>
        fact.source_id === issue.source_id &&
        String(fact.source_version) === issueVersion &&
        fact.source_status === "active"
    );
  };

  const associateFact = async (issue: (typeof issues)[number]) => {
    const factId = selectedFactIds[issue.id];

    if (!factId) return;

    setAssociatingId(issue.id);
    setAssociationErrors((prev) => ({ ...prev, [issue.id]: "" }));

    try {
      await apiFetch(
        `/api/findings/${encodeURIComponent(issue.id)}/associate-fact`,
        {
          method: "PATCH",
          body: JSON.stringify({
            fact_id: factId,
            passage_id: issue.passage_id,
          }),
        }
      );

      setAssociatedFacts((prev) => ({
        ...prev,
        [issue.id]: factId,
      }));
    } catch (error) {
      setAssociationErrors((prev) => ({
        ...prev,
        [issue.id]:
          error instanceof Error ? error.message : "Fact association failed.",
      }));
    } finally {
      setAssociatingId(null);
    }
  };

  // Restore previously saved decisions from the backend (skipped for demo drafts).
  useEffect(() => {
    // For demo drafts decisionsLoaded is already true from useState initializer;
    // skip network fetch entirely.
    if (isDemo) return;

    let cancelled = false;

    async function loadDecisions() {
      try {
        const data = await apiFetch(
          `/api/review/${encodeURIComponent(analysis.draft_id)}/decisions`
        );

        if (cancelled) return;

        setApproved(data.status === "approved");

        const restored: Record<string, "applied" | "dismissed"> = {};

        for (const [id, decision] of Object.entries(
          data.decisions ?? {}
        )) {
          if (decision === "applied" || decision === "dismissed") {
            restored[id] = decision;
          }
        }

        if (typeof data.content === "string") {
          setContent(data.content);

          const restoredDeltas: AppliedDelta[] = issues
            .filter(
              (issue) =>
                restored[issue.id] === "applied" &&
                issue.suggested_fix &&
                issue.severity !== "ACCESSIBILITY" &&
                issue.category !== "MISSING_ALT_TEXT"
            )
            .map((issue) => ({
              id: issue.id,
              originalText: issue.flagged_text,
              appliedFix: issue.suggested_fix!,
            }));

          setAppliedDeltas(restoredDeltas);
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

  // Apply a suggested fix and persist both content and decision.
  const apply = async (id: string) => {
    if (saving) return;

    const issue = issues.find((item) => item.id === id);

    if (!issue?.suggested_fix || !issue.flagged_text) {
      setActionError("No valid suggested fix is available.");
      return;
    }

    if (
      issue.severity === "ACCESSIBILITY" ||
      issue.category === "MISSING_ALT_TEXT"
    ) {
      setActionError(
        "This accessibility finding requires an image alt-text update, not a draft text replacement."
      );
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

    const index = content.indexOf(issue.flagged_text);

    const updatedContent =
      content.slice(0, index) +
      issue.suggested_fix +
      content.slice(index + issue.flagged_text.length);

    setSaving(true);

    try {
      if (!isDemo) {
        await apiFetch(
          `/api/review/findings/${encodeURIComponent(id)}/decision`,
          {
            method: "POST",
            body: JSON.stringify({
              decision: "applied",
              content: updatedContent,
            }),
          }
        );
      }

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
        issue.severity !== "ACCESSIBILITY" &&
        issue.category !== "MISSING_ALT_TEXT" &&
        issue.confidence >= 0.75 &&
        !resolved[issue.id] &&
        content.includes(issue.flagged_text)
    );

    if (targets.length === 0) {
      setActionError("No pending high-confidence fixes available.");
      return;
    }

    let newContent = content;
    const newDeltas = [...appliedDeltas];
    const newResolved = { ...resolved };
    const appliedIssues: typeof targets = [];

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
      appliedIssues.push(issue);
    }

    if (appliedIssues.length === 0) {
      setActionError("No matching text could be updated.");
      return;
    }

    setSaving(true);

    try {
      if (!isDemo) {
        for (const issue of appliedIssues) {
          await apiFetch(
            `/api/review/findings/${encodeURIComponent(issue.id)}/decision`,
            {
              method: "POST",
              body: JSON.stringify({
                decision: "applied",
                content: newContent,
              }),
            }
          );
        }
      }

      for (const issue of appliedIssues) {
        recordDecision("applied");
      }

      setContent(newContent);
      setAppliedDeltas(newDeltas);
      setResolved(newResolved);

      setActionError(
        `Applied ${appliedIssues.length} high-confidence fix${appliedIssues.length === 1 ? "" : "es"} across the draft.`
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <header className="flex flex-wrap items-end justify-between gap-4" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B"/>
              <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t3)", fontWeight: 600 }}>Citation gate</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 46px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.035em", margin: "0 0 10px", color: "var(--t1)" }}>
            Review Draft &amp; Proof Sheet
          </h1>

          <p className="text-sm text-[var(--t2)] mt-1.5 flex items-center gap-2 flex-wrap">
            <span>{issues.length} total findings</span>
            <span className="text-[#71717a]">·</span>

            <span
              className={
                pending > 0
                  ? "text-[var(--redhi)] font-semibold"
                  : "text-[#10b981] font-semibold"
              }
            >
              {pending > 0
                ? `${pending} decision required`
                : "All decisions complete"}
            </span>

            <span className="text-[#71717a]">·</span>

            <span className="text-sm text-[var(--t3)]">
              Keyboard:{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">
                J
              </kbd>
              /
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">
                K
              </kbd>{" "}
              navigate,{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">
                A
              </kbd>{" "}
              apply,{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">
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
              borderColor: copied ? "#10b981" : "rgba(176,18,27,0.3)",
              color: copied ? "#10b981" : "#ffffff",
              background: copied
                ? "rgba(16,185,129,0.12)"
                : "rgba(176,18,27,0.06)",
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
                Copied to Clipboard
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
                background: "var(--blood)",
                color: "#ffffff",
                boxShadow: "0 0 20px rgba(176,18,27,0.45)",
              }}
            >
              Approved · Open Living Ledger
            </Link>
          ) : (
            <button
              className="btn btn-primary"
              disabled={
                pending > 0 ||
                saving ||
                approved ||
                !decisionsLoaded ||
                isDemo
              }
              onClick={() => void approve()}
            >
              {saving
                ? "Saving..."
                : isDemo
                  ? "Demo · Approval disabled"
                  : approved
                    ? "Post Approved"
                    : !decisionsLoaded
                      ? "Loading Decisions..."
                      : "Approve Post to Ledger"}
            </button>
          )}
        </div>
      </header>

      {/* Batch Operations Toolbar */}
      <div className="panel p-3.5 flex flex-wrap items-center justify-between gap-3 border border-[var(--blood)]/20 bg-[var(--blood)]/5 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-[#a1a1aa]">
          <span className="w-2 h-2 rounded-full bg-[var(--blood)]" />
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
            className="btn text-xs px-3 py-1.5 h-auto font-semibold border-[var(--blood)]/30 hover:border-[var(--blood)] text-[var(--blood)]"
          >
            Accept All Safe Fixes
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
          className="rounded-lg border border-[var(--redhi)]/35 bg-[rgba(176,18,27,0.14)] p-3 text-sm text-[var(--t1)] flex items-center justify-between"
        >
          <span>{actionError}</span>

          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs text-[var(--redhi)] hover:underline font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Review Columns */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)]">
        {/* Left Column: Draft Review / Diff Sheet */}
        <section
          className="panel p-6 flex flex-col gap-5 h-fit border border-[var(--blood)]/18 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          aria-label="Draft"
        >
          {/* View Mode Selector Tabs */}
          <div className="flex items-center justify-between border-b border-[var(--blood)]/15 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setViewMode("proof")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "proof"
                    ? "bg-[var(--blood)] text-white shadow-[0_2px_12px_rgba(176,18,27,0.45)]"
                    : "text-[var(--t2)] hover:text-white"
                }`}
              >
                Proof Sheet
              </button>

              <button
                type="button"
                onClick={() => setViewMode("diff")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  viewMode === "diff"
                    ? "bg-[var(--blood)] text-white shadow-[0_2px_12px_rgba(176,18,27,0.45)]"
                    : "text-[var(--t2)] hover:text-white"
                }`}
              >
                <span>Visual Diff</span>

                {appliedDeltas.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-black/60 text-white font-mono">
                    {appliedDeltas.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewMode("clean")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "clean"
                    ? "bg-[var(--blood)] text-white shadow-[0_2px_12px_rgba(176,18,27,0.45)]"
                    : "text-[var(--t2)] hover:text-white"
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
                          ? "active ring-2 ring-[var(--blood)]/70 px-1 py-0.5 rounded"
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
                    <div className="text-xs font-mono font-bold uppercase text-[var(--blood)] mb-2">
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
                              - BEFORE:
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
                  className="text-[var(--blood)] hover:underline font-bold"
                >
                  {copied ? "Copied" : "Copy text"}
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
                    ? "border-[var(--blood)] bg-[var(--blood)]/10"
                    : "border-white/5 bg-black/30 hover:border-[var(--blood)]/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#a1a1aa]">
                    {issue.flagged_text}
                  </span>

                  <span className="text-xs text-[#71717a]">·</span>

                  <span className="text-xs text-[var(--redhi)] font-mono">
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
  canApply={
    issue.severity !== "ACCESSIBILITY" &&
    issue.category !== "MISSING_ALT_TEXT" &&
    Boolean(issue.flagged_text) &&
    content.includes(issue.flagged_text)
  }
  onApply={() => void apply(issue.id)}
  onDismiss={() => void dismiss(issue.id)}
  facts={getEligibleFacts(issue)}
  selectedFactId={selectedFactIds[issue.id] ?? ""}
  linkedFactId={associatedFacts[issue.id] ?? issue.fact_id ?? null}
  associating={associatingId === issue.id}
  associationError={associationErrors[issue.id] || null}
  onFactChange={(factId) =>
    setSelectedFactIds((prev) => ({ ...prev, [issue.id]: factId }))
  }
  onAssociateFact={() => void associateFact(issue)}
  showFactAssociation={
    !isDemo &&
    Boolean(issue.source_id) &&
    issue.passage_id !== "NO_VERIFIED_CITATION"
  }
/>
          ))}
        </section>
      </div>
    </div>
  );
}

