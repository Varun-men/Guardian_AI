"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { analyzeDraft } from "@/lib/analyze";
import { useLedger } from "@/lib/ledger-store";

type Scenario = {
  id: string;
  name: string;
  tag: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
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
    badgeBg: "rgba(176, 18, 27, 0.22)",
    badgeColor: "var(--redhi)",
    badgeBorder: "rgba(242, 103, 95, 0.4)",
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
    badgeBg: "rgba(239, 68, 68, 0.18)",
    badgeColor: "#f87171",
    badgeBorder: "rgba(239, 68, 68, 0.4)",
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
    badgeBg: "rgba(245, 184, 46, 0.18)",
    badgeColor: "var(--yellow)",
    badgeBorder: "rgba(245, 184, 46, 0.4)",
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
    badgeBg: "rgba(185, 122, 255, 0.18)",
    badgeColor: "#c084fc",
    badgeBorder: "rgba(185, 122, 255, 0.4)",
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
    badgeBg: "rgba(16, 185, 129, 0.18)",
    badgeColor: "#34d399",
    badgeBorder: "rgba(16, 185, 129, 0.4)",
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
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* ─── Top Header (Matching Review Page Prominence & Scale) ─── */}
      <header className="flex flex-wrap items-end justify-between gap-4" style={{ marginBottom: 4 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B" />
              <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--t3)", fontWeight: 600 }}>
              Pre-publish verification
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 46px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.035em", margin: "0 0 10px", color: "var(--t1)" }}>
            Analyze Draft &amp; Verify Claims
          </h1>
          <p className="text-sm text-[var(--t2)] mt-1.5 flex items-center gap-2 flex-wrap">
            <span>5 scenario presets</span>
            <span className="text-[#71717a]">·</span>
            <span className="text-[#10b981] font-semibold">Zero-latency deterministic checks</span>
            <span className="text-[#71717a]">·</span>
            <span className="text-sm text-[var(--t3)]">
              Evaluates guidelines, competitor benchmarks &amp; pricing drift
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => selectScenario(SCENARIOS[0])}
            className="btn"
            style={{ fontSize: 14 }}
          >
            Reset Demo Baseline
          </button>
        </div>
      </header>

      {/* ─── Scenario Selector Tabs (Large, Clean Dark Red, No Orange Gradient) ─── */}
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--t3)] font-semibold px-1">
          <span>Select Scenario Preset:</span>
          <span>5 Test Scenarios Available</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
          {SCENARIOS.map((s) => {
            const isSelected = activeScenario === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectScenario(s)}
                style={{
                  padding: "18px 20px",
                  borderRadius: 16,
                  border: isSelected ? "1.5px solid var(--redhi)" : "1px solid var(--line)",
                  background: isSelected ? "rgba(176, 18, 27, 0.2)" : "var(--s1)",
                  boxShadow: isSelected ? "0 4px 20px rgba(176, 18, 27, 0.3)" : "none",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 14,
                  minHeight: 104,
                  transition: "all 0.15s var(--ease)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontFamily: "var(--mono)",
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 6,
                      background: s.badgeBg,
                      color: s.badgeColor,
                      border: `1px solid ${s.badgeBorder}`,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {s.tag}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 17.5, fontWeight: 700, color: "#ffffff", lineHeight: 1.25 }}>
                    {s.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {currentScenarioObj && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: 14,
              background: "var(--s1)",
              border: "1px solid var(--line)",
              fontSize: 14.5,
              color: "var(--t1)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "var(--redhi)",
                fontWeight: 700,
                fontFamily: "var(--mono)",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Preset Focus:
            </span>
            <span style={{ color: "var(--t2)" }}>{currentScenarioObj.description}</span>
          </div>
        )}
      </section>

      {/* ─── Draft Input Form ─── */}
      <section
        className="panel"
        style={{
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          border: "1px solid rgba(176, 18, 27, 0.3)",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 14 }}>
          <label htmlFor="draft" style={{ fontWeight: 600, fontSize: 17, color: "#ffffff", display: "flex", alignItems: "center", gap: 10 }}>
            <span>Draft Copy Content</span>
            <span style={{ fontSize: 12.5, color: "var(--redhi)", fontFamily: "var(--mono)", fontWeight: 500 }}>· Ready for evaluation</span>
          </label>
          <button
            type="button"
            onClick={() => setText("")}
            style={{ fontSize: 13, color: "var(--t3)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--mono)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--redhi)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t3)")}
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
          style={{
            background: "var(--s2)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: 18,
            fontSize: 18,
            lineHeight: 1.7,
            color: "#ffffff",
            resize: "vertical",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blood)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
        />

        {/* ─── Media & Image Settings ─── */}
        <div
          style={{
            padding: 18,
            borderRadius: 14,
            background: "var(--s2)",
            border: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#ffffff", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={hasImage}
              onChange={(e) => setHasImage(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--blood)", cursor: "pointer" }}
            />
            <span style={{ fontWeight: 600 }}>Draft includes media / image asset</span>
          </label>

          {hasImage && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, paddingTop: 6, borderTop: "1px solid var(--line)" }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--t3)", fontFamily: "var(--mono)", display: "block", marginBottom: 6 }}>
                  Filename / Asset Key
                </label>
                <input
                  type="text"
                  value={imageFilename}
                  onChange={(e) => setImageFilename(e.target.value)}
                  placeholder="e.g. orbit-hero.png"
                  style={{
                    background: "var(--s1)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    width: "100%",
                    fontSize: 13,
                    fontFamily: "var(--mono)",
                    color: "#ffffff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blood)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--t3)", fontFamily: "var(--mono)", display: "block", marginBottom: 6 }}>
                  Image Alt Text (WCAG Check)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Leave empty to trigger missing-alt rule"
                  style={{
                    background: "var(--s1)",
                    border: "1px solid var(--line)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    width: "100%",
                    fontSize: 13,
                    fontFamily: "var(--mono)",
                    color: "#ffffff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blood)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
                />
              </div>
            </div>
          )}
        </div>

        {/* ─── Actions & Analyze Trigger ─── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, paddingTop: 4 }}>
          <div style={{ fontSize: 13, color: "var(--t3)", fontFamily: "var(--mono)" }}>
            {text.split(/\s+/).filter(Boolean).length} words · {text.length} characters
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {error && (
              <p role="alert" style={{ fontSize: 13, color: "#ef4444", fontWeight: 600, margin: 0, maxWidth: 360 }}>
                {error}
              </p>
            )}
            <button
              className="pill red"
              disabled={!text.trim() || stage !== null}
              onClick={run}
              style={{
                height: 44,
                padding: "0 26px",
                fontSize: 15,
                fontWeight: 600,
                cursor: !text.trim() || stage !== null ? "not-allowed" : "pointer",
                opacity: !text.trim() || stage !== null ? 0.45 : 1,
              }}
            >
              {stage === null ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Analyze draft copy
                </span>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Analyzing pipeline...
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ─── Pipeline Progress Visualizer ─── */}
      {stage !== null && (
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            border: "1px solid rgba(176, 18, 27, 0.4)",
            background: "rgba(176, 18, 27, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--redhi)" }}>
            <span>Verification Pipeline Progress</span>
            <span style={{ color: "var(--yellow)" }}>Running checks</span>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10, margin: 0, padding: 0, listStyle: "none" }} aria-live="polite">
            {STAGES.map((s, k) => (
              <li
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: k < stage ? "1px solid rgba(16, 185, 129, 0.3)" : k === stage ? "1px solid rgba(176, 18, 27, 0.5)" : "1px solid var(--line)",
                  background: k < stage ? "rgba(16, 185, 129, 0.1)" : k === stage ? "rgba(176, 18, 27, 0.2)" : "var(--s1)",
                  color: "#ffffff",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontFamily: "var(--mono)",
                    fontWeight: 700,
                    background: k < stage ? "#10b981" : k === stage ? "var(--blood)" : "rgba(255,255,255,0.1)",
                    color: "#ffffff",
                  }}
                >
                  {k < stage ? "DONE" : k === stage ? "RUNNING" : "WAITING"}
                </span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
