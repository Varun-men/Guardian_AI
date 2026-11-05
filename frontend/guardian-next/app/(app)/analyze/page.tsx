"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { analyzeDraft } from "@/lib/analyze";
import { mockAnalyze } from "@/lib/mock";
import { useLedger } from "@/lib/ledger-store";

const STAGES = [
  "Running rule checks for banned terms & competitor mentions",
  "Extracting claims & retrieving verified knowledge evidence",
  "Verifying citations & policy compliance"
];

export default function AnalyzePage() {
  const router = useRouter();
  const { setAnalysis } = useLedger();
  const [text, setText] = useState(mockAnalyze.content);
  const [hasImage, setHasImage] = useState(true);
  const [stage, setStage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setError(null);
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 500);
    const t2 = setTimeout(() => setStage(2), 1000);
    try {
      const res = await analyzeDraft(text, hasImage);
      setAnalysis(res);
      router.push("/review");
    } catch {
      setError("The analysis service did not respond. Check that the backend is running, then try again.");
      setStage(null);
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#e8f4ff] font-[family-name:var(--font-display)]">
          Analyze a draft
        </h1>
        <p className="text-[#7ab3cc] text-sm mt-1">
          Paste your copy below. Deterministic rule checks run first in milliseconds, followed by citation retrieval and verification.
        </p>
      </header>

      <section className="panel p-6 flex flex-col gap-5 border border-[#00c8ff]/20 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between border-b border-[#00c8ff]/10 pb-3">
          <label htmlFor="draft" className="font-semibold text-sm text-[#e8f4ff] flex items-center gap-2">
            <span>Draft Copy</span>
            <span className="text-xs text-[#ffe600] font-mono">• Ready for evaluation</span>
          </label>
          <button
            type="button"
            onClick={() => setText(mockAnalyze.content)}
            className="text-xs text-[#00c8ff] hover:underline font-mono"
          >
            Reset sample draft
          </button>
        </div>

        <textarea
          id="draft"
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste draft copy to check..."
          className="panel-raised p-4 w-full text-[1.02rem] leading-7 resize-y text-[#e8f4ff] font-sans border border-white/10 focus:outline-none focus:border-[#00c8ff] focus:ring-1 focus:ring-[#00c8ff]"
        />

        <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-3 text-sm text-[#e8f4ff] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasImage}
              onChange={(e) => setHasImage(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 accent-[#00c8ff] cursor-pointer"
            />
            <span>
              Draft includes <span className="font-mono text-xs text-[#00c8ff]">orbit-hero.png</span> with no alt text
            </span>
          </label>

          <div className="flex items-center gap-4">
            {error && (
              <p role="alert" className="text-xs text-[#ff4d6d] font-semibold max-w-sm">
                {error}
              </p>
            )}
            <button
              className="btn btn-primary"
              disabled={!text.trim() || stage !== null}
              onClick={run}
            >
              {stage === null ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Analyze draft copy
                </>
              ) : (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                  Analyzing pipeline...
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {stage !== null && (
        <div className="panel p-6 flex flex-col gap-3.5 border border-[#00c8ff]/30 bg-[#00c8ff]/5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#00c8ff]">
            <span>Verification Pipeline Progress</span>
            <span className="text-[#ffe600]">Active</span>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm" aria-live="polite">
            {STAGES.map((s, k) => (
              <li
                key={s}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  k < stage
                    ? "border-[#00e5a0]/30 bg-[#00e5a0]/10 text-[#e8f4ff]"
                    : k === stage
                    ? "border-[#00c8ff]/50 bg-[#00c8ff]/15 text-[#e8f4ff] shadow-[0_0_15px_rgba(0,200,255,0.15)]"
                    : "border-white/5 text-[#7ab3cc]/50"
                }`}
              >
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                    k < stage
                      ? "bg-[#00e5a0] text-black"
                      : k === stage
                      ? "bg-[#00c8ff] text-black animate-pulse"
                      : "bg-white/10 text-[#7ab3cc]"
                  }`}
                >
                  {k < stage ? "✓ DONE" : k === stage ? "RUNNING" : "WAITING"}
                </span>
                <span className="font-medium text-xs md:text-sm">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
