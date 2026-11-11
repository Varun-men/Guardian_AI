"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { analyzeDraft } from "@/lib/analyze";
import { useLedger } from "@/lib/ledger-store";

type Scenario = {
  id: string;
  name: string;
  tag: string;
  badgeColor: string;
  description: string;
  content: string;
  hasImage: boolean;
  imageFilename: string;
  imageAlt: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "standard",
    name: "Orbit Launch",
    tag: "MIXED DEMO",
    badgeColor: "#ff6b00",
    description: "Comparative speed claim, verified starter pricing fact ($29), and missing image alt text.",
    content: "Meet Orbit. Our app is 3x faster than any competitor. Plans start at $29.",
    hasImage: true,
    imageFilename: "orbit-hero.png",
    imageAlt: "",
  },
  {
    id: "comparative",
    name: "Competitor Comparison",
    tag: "HIGH RISK",
    badgeColor: "#ef4444",
    description: "Flags unsubstantiated comparative claims against competitors without verified benchmarks.",
    content: "Orbit is twice as fast as Linear and half the cost of Jira. Built for modern developer velocity.",
    hasImage: false,
    imageFilename: "",
    imageAlt: "",
  },
  {
    id: "drift",
    name: "Pricing Drift",
    tag: "LEDGER DRIFT",
    badgeColor: "#ff9500",
    description: "Claims an outdated price ($69/mo) when the verified Fact Registry lists Orbit Pro at $79/mo.",
    content: "Get full access with Orbit Pro for just $69 per month. All advanced security rules included.",
    hasImage: false,
    imageFilename: "",
    imageAlt: "",
  },
  {
    id: "accessibility",
    name: "Accessibility",
    tag: "WCAG 1.1.1",
    badgeColor: "#b97aff",
    description: "Deterministic accessibility check: hero banner image missing alt description attribute.",
    content: "Discover next-generation claim verification and deterministic compliance with Orbit.",
    hasImage: true,
    imageFilename: "dashboard-preview.png",
    imageAlt: "",
  },
  {
    id: "clean",
    name: "Compliant & Verified",
    tag: "100% CLEAN",
    badgeColor: "#10b981",
    description: "All statements align with approved guidelines; image has descriptive alt text.",
    content: "Meet Orbit. Our app is built for speed and engineering rigor. Plans start at $29.",
    hasImage: true,
    imageFilename: "orbit-logo.png",
    imageAlt: "Orbit verified brand mark",
  },
];

const STAGES = [
  "Running deterministic rules for banned terms & competitor mentions",
  "Extracting factual claims & retrieving verified knowledge evidence",
  "Verifying citations & policy compliance against Fact Registry",
];

export default function AnalyzePage() {
  const router = useRouter();
  const { setAnalysis } = useLedger();

  const [activeScenario, setActiveScenario] = useState<string>("standard");
  const [text, setText] = useState(SCENARIOS[0].content);
  const [hasImage, setHasImage] = useState(SCENARIOS[0].hasImage);
  const [imageFilename, setImageFilename] = useState(SCENARIOS[0].imageFilename);
  const [imageAlt, setImageAlt] = useState(SCENARIOS[0].imageAlt);

  const [stage, setStage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectScenario = (sc: Scenario) => {
    setActiveScenario(sc.id);
    setText(sc.content);
    setHasImage(sc.hasImage);
    setImageFilename(sc.imageFilename);
    setImageAlt(sc.imageAlt);
    setError(null);
  };


const run = async () => {
  if (!text.trim()) {
    setError("Please enter draft content before analyzing.");
    return;
  }

  setError(null);
  setStage(0);

  const t1 = setTimeout(() => setStage(1), 450);
  const t2 = setTimeout(() => setStage(2), 950);

  const images = hasImage
    ? [
        {
          filename: imageFilename || "orbit-hero.png",
          alt: imageAlt,
        },
      ]
    : [];

  try {
    const res = await analyzeDraft(text, images);

    if (!res?.draft_id || !Array.isArray(res.issues)) {
      throw new Error("Backend returned an invalid analysis response.");
    }

    setAnalysis(res);
    router.push("/review");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Analysis failed. Please check the backend connection and try again."
    );
  } finally {
    clearTimeout(t1);
    clearTimeout(t2);
    setStage(null);
  }
};


  const currentScenarioObj = SCENARIOS.find((s) => s.id === activeScenario);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-display)]">
          Analyze Draft Copy
        </h1>
        <p className="text-[#a1a1aa] text-sm mt-1">
          Paste marketing copy or select a pre-configured scenario below. Deterministic rule checks run first in milliseconds, followed by citation retrieval and verification.
        </p>
      </header>

      {/* ─── Scenario Selector Carousel / Pills ─── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#a1a1aa]">
          <span>Select Scenario Preset:</span>
          <span>5 Available Test Cases</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {SCENARIOS.map((s) => {
            const isSelected = activeScenario === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectScenario(s)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? "border-[#ff6b00] bg-[#ff6b00]/12 shadow-[0_0_15px_rgba(255,107,0,0.2)]"
                    : "border-white/10 bg-[#0c0c0e] hover:border-[#ff6b00]/40"
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: `${s.badgeColor}20`,
                      color: s.badgeColor,
                      border: `1px solid ${s.badgeColor}40`,
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">
                    {s.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {currentScenarioObj && (
          <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-[#a1a1aa] flex items-center gap-2">
            <span className="text-[#ff6b00] font-bold">Preset Focus:</span>
            <span>{currentScenarioObj.description}</span>
          </div>
        )}
      </section>

      {/* ─── Draft Input Form ─── */}
      <section className="panel p-6 flex flex-col gap-5 border border-[#ff6b00]/25 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between border-b border-[#ff6b00]/15 pb-3">
          <label htmlFor="draft" className="font-semibold text-sm text-white flex items-center gap-2">
            <span>Draft Copy Content</span>
            <span className="text-xs text-[#ff9500] font-mono">• Ready for evaluation</span>
          </label>
          <button
            type="button"
            onClick={() => setText("")}
            className="text-xs text-[#a1a1aa] hover:text-[#ff6b00] font-mono"
          >
            Clear text
          </button>
        </div>

        <textarea
          id="draft"
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste draft copy to check against brand rules and fact sources..."
          className="panel-raised p-4 w-full text-[1.02rem] leading-7 resize-y text-white font-sans border border-white/10 focus:outline-none focus:border-[#ff6b00] focus:ring-1 focus:ring-[#ff6b00]"
        />

        {/* ─── Media & Image Settings ─── */}
        <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-3">
          <label className="flex items-center gap-3 text-sm text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hasImage}
              onChange={(e) => setHasImage(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 accent-[#ff6b00] cursor-pointer"
            />
            <span className="font-semibold text-sm">
              Draft includes media / image asset
            </span>
          </label>

          {hasImage && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-white/5">
              <div>
                <label className="text-xs text-[#a1a1aa] font-mono block mb-1">
                  Filename / Asset Key
                </label>
                <input
                  type="text"
                  value={imageFilename}
                  onChange={(e) => setImageFilename(e.target.value)}
                  placeholder="e.g. orbit-hero.png"
                  className="panel-raised px-3 py-1.5 w-full text-xs font-mono text-white focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div>
                <label className="text-xs text-[#a1a1aa] font-mono block mb-1">
                  Image Alt Text (WCAG Check)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Leave empty to trigger missing-alt rule"
                  className="panel-raised px-3 py-1.5 w-full text-xs font-mono text-white focus:outline-none focus:border-[#ff6b00]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── Actions & Analyze Trigger ─── */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
          <div className="text-xs text-[#a1a1aa] font-mono">
            {text.split(/\s+/).filter(Boolean).length} words · {text.length} characters
          </div>

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

      {/* ─── Pipeline Progress Visualizer ─── */}
      {stage !== null && (
        <div className="panel p-6 flex flex-col gap-3.5 border border-[#ff6b00]/30 bg-[#ff6b00]/5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[#ff6b00]">
            <span>Verification Pipeline Progress</span>
            <span className="text-[#ff9500] animate-pulse">Running checks</span>
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
