import { Reveal } from "./Reveal";

export function HowCards() {
  return (
    <section className="how" id="cards">
      <div className="wrap">
        <div style={{ marginBottom: "14px" }}>
          <span
            className="n"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "12.5px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--redhi)",
            }}
          >
            Three-Stage Verification Pipeline
          </span>
        </div>

        <Reveal as="h2" className="big">
          How Guardian reviews a post
        </Reveal>

        <p
          style={{
            color: "var(--t2)",
            fontSize: "15.5px",
            maxWidth: "620px",
            margin: "10px 0 36px",
            lineHeight: 1.6,
          }}
        >
          From millisecond pre-publish deterministic rule checks to evidence citations and continuous drift detection, every claim is tied to verified truth.
        </p>

        <div className="cards">
          {/* Card 1: Pre-publish review */}
          <Reveal as="article" className="mc" delayMs={0}>
            <span className="n" style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.1em" }}>
              STEP 01 · DETERMINISTIC RULES
            </span>
            <h3 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Pre-publish review
            </h3>
            <p style={{ fontSize: "16px", color: "var(--t2)", lineHeight: 1.6 }}>
              Instant zero-latency checks catch banned terms, competitor names, and missing image alt text before calling any model.
            </p>

            <div
              className="vis"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "9px",
                justifyContent: "flex-start",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  fontFamily: "var(--mono)",
                  color: "var(--t3)",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>DRAFT SCANNER</span>
                <span style={{ color: "#10b981", display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  0ms latency
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--blood)", flexShrink: 0 }} />
                  <span style={{ color: "var(--t1)" }}>Banned vocabulary</span>
                </div>
                <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--redhi)", background: "rgba(242,103,95,0.12)", padding: "2px 7px", borderRadius: "4px" }}>
                  Flagged
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--yellow)", flexShrink: 0 }} />
                  <span style={{ color: "var(--t1)" }}>Competitor mention</span>
                </div>
                <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--yellow)", background: "rgba(245,184,46,0.12)", padding: "2px 7px", borderRadius: "4px" }}>
                  Benchmark Req
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--yellow)", flexShrink: 0 }} />
                  <span style={{ color: "var(--t1)" }}>Missing image alt text</span>
                </div>
                <span style={{ fontSize: "11px", fontFamily: "var(--mono)", color: "var(--yellow)", background: "rgba(245,184,46,0.12)", padding: "2px 7px", borderRadius: "4px" }}>
                  WCAG 1.1.1
                </span>
              </div>
            </div>
          </Reveal>

          {/* Card 2: Citation gate */}
          <Reveal as="article" className="mc" delayMs={120}>
            <span className="n" style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.1em" }}>
              STEP 02 · CITATION GATE
            </span>
            <h3 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Evidence citation gate
            </h3>
            <p style={{ fontSize: "16px", color: "var(--t2)", lineHeight: 1.6 }}>
              Every single AI finding quotes an approved passage. Deterministic code confirms the quote exists before flagging.
            </p>

            <div
              className="vis"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                justifyContent: "flex-start",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  fontFamily: "var(--mono)",
                  color: "var(--t3)",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>EVIDENCE MATCHER</span>
                <span style={{ color: "var(--redhi)", display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--redhi)", display: "inline-block" }} />
                  High Risk Finding
                </span>
              </div>

              <div
                style={{
                  padding: "9px 11px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  fontSize: "13.5px",
                  lineHeight: "1.45",
                  color: "var(--t1)",
                }}
              >
                &ldquo;Our app is{" "}
                <span
                  style={{
                    color: "var(--redhi)",
                    background: "rgba(242,103,95,0.18)",
                    padding: "1px 5px",
                    borderRadius: "4px",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  3x faster than any competitor
                </span>
                .&rdquo;
              </div>

              <div
                style={{
                  padding: "9px 11px",
                  borderRadius: "8px",
                  background: "rgba(242,103,95,0.08)",
                  border: "1px solid rgba(242,103,95,0.25)",
                  fontSize: "12px",
                }}
              >
                <div style={{ fontWeight: 600, color: "var(--redhi)", marginBottom: "3px" }}>
                  Source: Claims Policy v2 § 4.1
                </div>
                <div style={{ color: "var(--t3)", fontFamily: "var(--mono)", fontSize: "11px" }}>
                  No approved benchmark found in knowledge base.
                </div>
              </div>
            </div>
          </Reveal>

          {/* Card 3: Living ledger */}
          <Reveal as="article" className="mc" delayMs={240}>
            <span className="n" style={{ fontFamily: "var(--mono)", fontSize: "12px", letterSpacing: "0.1em" }}>
              STEP 03 · DRIFT DETECTION
            </span>
            <h3 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Living Claim Ledger
            </h3>
            <p style={{ fontSize: "16px", color: "var(--t2)", lineHeight: 1.6 }}>
              When a fact changes in the Registry, every linked post is automatically flagged stale with an audit log record.
            </p>

            <div
              className="vis"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                justifyContent: "flex-start",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  fontFamily: "var(--mono)",
                  color: "var(--t3)",
                  paddingBottom: "8px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <span>FACT DRIFT MONITOR</span>
                <span style={{ color: "var(--yellow)", display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--yellow)", display: "inline-block" }} />
                  1 Post Stale
                </span>
              </div>

              <div
                style={{
                  padding: "9px 11px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.03)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "11px", color: "var(--t3)", fontFamily: "var(--mono)" }}>
                    FACT: fact_starter_price
                  </div>
                  <div style={{ fontSize: "17px", fontWeight: 700, fontFamily: "var(--mono)", marginTop: "2px" }}>
                    <span style={{ textDecoration: "line-through", color: "var(--t3)", marginRight: "8px" }}>$29</span>
                    <span style={{ color: "var(--yellow)" }}>→ $39</span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--mono)",
                    color: "var(--yellow)",
                    background: "rgba(245,184,46,0.12)",
                    padding: "3px 8px",
                    borderRadius: "6px",
                  }}
                >
                  Sync Needed
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11.5px",
                  color: "var(--t2)",
                  padding: "4px 2px",
                }}
              >
                <span>Downstream draft copy</span>
                <span style={{ color: "var(--t1)", fontWeight: 600, fontFamily: "var(--mono)" }}>
                  1-Click Update Ready
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
