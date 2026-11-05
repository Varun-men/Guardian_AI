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
      <div className="panel p-8 max-w-xl flex flex-col gap-4 border border-[#00c8ff]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00c8ff]/10 border border-[#00c8ff]/30 flex items-center justify-center text-[#00c8ff]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2l8 3v6c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11V5l8-3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#e8f4ff]">Nothing to review yet</h1>
            <p className="text-[#7ab3cc] text-sm">Analyze draft copy to inspect findings and check citations.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Link href="/analyze" className="btn btn-primary">
            Analyze a draft
          </Link>
          <button
            onClick={() => setAnalysis(mockAnalyze)}
            className="btn"
            style={{ color: "#ffe600", borderColor: "rgba(255,230,0,0.3)" }}
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
  const [active, setActive] = useState<string | null>(issues[0]?.id ?? null);
  const [resolved, setResolved] = useState<Record<string, "applied" | "dismissed">>({});
  const [approved, setApproved] = useState(false);
  const pending = issues.filter((i) => i.needs_human_decision && !resolved[i.id]).length;

  const segments = useMemo(() => {
    const hits = issues
      .map((i) => ({ i, at: content.indexOf(i.flagged_text) }))
      .filter((h) => h.at >= 0)
      .sort((a, b) => a.at - b.at);
    const out: { text: string; issue?: (typeof issues)[number] }[] = [];
    let cur = 0;
    for (const { i, at } of hits) {
      if (at < cur) continue;
      if (at > cur) out.push({ text: content.slice(cur, at) });
      out.push({ text: i.flagged_text, issue: i });
      cur = at + i.flagged_text.length;
    }
    if (cur < content.length) out.push({ text: content.slice(cur) });
    return out;
  }, [content, issues]);

  const apply = (id: string) => {
    const i = issues.find((x) => x.id === id)!;
    if (i.suggested_fix && content.includes(i.flagged_text)) {
      setContent(content.replace(i.flagged_text, i.suggested_fix));
    }
    setResolved({ ...resolved, [id]: "applied" });
    recordDecision("applied");
  };

  const approve = () => {
    approveDraft(content, issues);
    setApproved(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#e8f4ff] font-[family-name:var(--font-display)]">
            Review draft
          </h1>
          <p className="text-sm text-[#7ab3cc] mt-1 flex items-center gap-2">
            <span>{issues.length} findings</span>
            <span className="text-[#3d6070]">•</span>
            <span className={pending > 0 ? "text-[#ffe600] font-semibold" : "text-[#00e5a0]"}>
              {pending} need your decision
            </span>
          </p>
        </div>

        {approved ? (
          <Link
            href="/ledger"
            className="btn btn-primary"
            style={{
              background: "linear-gradient(135deg, #00c8ff 0%, #00e5a0 100%)",
              color: "#04090f",
              boxShadow: "0 0 20px rgba(0,229,160,0.35)",
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
          className="panel p-6 flex flex-col gap-5 h-fit border border-[#00c8ff]/15 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          aria-label="Draft"
        >
          <div className="flex items-center justify-between border-b border-[#00c8ff]/10 pb-3">
            <h2 className="text-xs uppercase tracking-wider font-mono font-bold text-[#7ab3cc]">
              Draft Preview
            </h2>
            <span className="text-xs text-[#3d6070] font-mono">Interactive Proof Sheet</span>
          </div>

          <div className="text-base text-[#e8f4ff] leading-relaxed p-4 rounded-xl bg-black/20 border border-white/5">
            {segments.map((s, k) =>
              s.issue ? (
                <span key={k} className="inline">
                  <mark
                    tabIndex={0}
                    role="button"
                    className={`claim tone-${s.issue.severity.toLowerCase()} ${
                      active === s.issue.id ? "active ring-2 ring-[#00c8ff]/60 px-1 py-0.5 rounded" : ""
                    }`}
                    onClick={() => setActive(s.issue!.id)}
                    onKeyDown={(e) => e.key === "Enter" && setActive(s.issue!.id)}
                  >
                    {s.text}
                  </mark>
                  <span
                    className="no cursor-pointer transition-transform hover:scale-110"
                    onClick={() => setActive(s.issue!.id)}
                  >
                    {issues.indexOf(s.issue) + 1}
                  </span>{" "}
                </span>
              ) : (
                <span key={k}>{s.text}</span>
              )
            )}
          </div>

          {/* Non-textual or missing alt tags */}
          {issues
            .filter((i) => !content.includes(i.flagged_text))
            .map((i) => (
              <div
                key={i.id}
                onClick={() => setActive(i.id)}
                className={`p-3 rounded-lg border text-sm flex items-center justify-between cursor-pointer transition-colors ${
                  active === i.id
                    ? "border-[#00c8ff] bg-[#00c8ff]/10"
                    : "border-white/5 bg-black/20 hover:border-[#00c8ff]/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#7ab3cc]">{i.flagged_text}</span>
                  <span className="text-xs text-[#3d6070]">•</span>
                  <span className="text-xs text-[#ffe600]">{i.category.toLowerCase().replace(/_/g, " ")}</span>
                </div>
                <span className="no">{issues.indexOf(i) + 1}</span>
              </div>
            ))}
        </section>

        {/* Right Column: Finding Cards */}
        <section className="flex flex-col gap-4" aria-label="Findings">
          {issues.map((i) => (
            <IssueCard
              key={i.id}
              issue={i}
              active={active === i.id}
              resolved={resolved[i.id]}
              onSelect={() => setActive(i.id)}
              onApply={() => apply(i.id)}
              onDismiss={() => {
                setResolved({ ...resolved, [i.id]: "dismissed" });
                recordDecision("dismissed");
              }}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
