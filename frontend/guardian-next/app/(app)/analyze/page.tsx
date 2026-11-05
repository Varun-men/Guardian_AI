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
      const images = hasImage
  ? [
      {
        filename: "orbit-hero.png",
        alt: "",
      },
    ]
  : [];

const res = await analyzeDraft(text, images);
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
        <h1 className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-display)]">
          Analyze a draft
        </h1>
        <p className="text-[#a1a1aa] text-sm mt-1">
          Paste your copy below. Deterministic rule checks run first in milliseconds, followed by citation retrieval and verification.
        </p>
      </header>

      <section className="panel p-6 flex flex-col gap-5 border border-[#ff6b00]/25 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-[#ff6b00]/15 pb-3">
          <label htmlFor="draft" className="font-semibold text-sm text-white flex items-center gap-2">
            <span>Draft Copy</span>
            <span className="text-xs text-[#ff9500] font-mono">• Ready for evaluation</span>
          </label>
          <button
            type="button"
            onClick={() => setText(mockAnalyze.content)}
            className="text-xs text-[#ff6b00] hover:underline font-mono"
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
          className="panel-raised p-4 w-full text-[1.02rem] leading-7 resize-y text-white font-sans border border-white/10 focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00]"
        />

        <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-3 text-sm text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasImage}
              onChange={(e) => setHasImage(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 accent-[#ff6b00] cursor-pointer"
            />
            <span>
              Draft includes <span className="font-mono text-xs text-[#ff6b00]">orbit-hero.png</span> with no alt text
            </span>
          </label>

          <div className="flex items-center gap-4">
            {error && (
              <p role="alert" className="text-xs text-[#ef4444] font-semibold max-w-sm">
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
        <div className="panel p-6 flex flex-col gap-3.5 border border-[#ff6b00]/30 bg-[#ff6b00]/5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#ff6b00]">
            <span>Verification Pipeline Progress</span>
            <span className="text-[#ff9500]">Active</span>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm" aria-live="polite">
            {STAGES.map((s, k) => (
              <li
                key={s}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  k < stage
                    ? "border-[#10b981]/30 bg-[#10b981]/10 text-white"
                    : k === stage
                    ? "border-[#ff6b00]/50 bg-[#ff6b00]/15 text-white shadow-[0_0_15px_rgba(255,107,0,0.18)]"
                    : "border-white/5 text-[#a1a1aa]/50"
                }`}
              >
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                    k < stage
                      ? "bg-[#10b981] text-black"
                      : k === stage
                      ? "bg-[#ff6b00] text-black animate-pulse"
                      : "bg-white/10 text-[#a1a1aa]"
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
