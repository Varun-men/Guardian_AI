import type { Issue } from "@/lib/types";

const C = {
  neon: "#ff6b00",
  yellow: "#ff9500",
  text: "#ffffff",
  text2: "#a1a1aa",
  muted: "#71717a",
  surface: "#0c0c0e",
  raised: "#17171a",
  line: "rgba(255,107,0,.18)",
  ok: "#10b981",
  high: "#ef4444",
  medium: "#ff6b00",
  a11y: "#b97aff",
};

const BG = {
  card: "rgba(255,107,0,.025)",
  raised: "rgba(255,107,0,.06)",
};

const LABEL: Record<Issue["severity"], string> = {
  HIGH: "High Risk",
  MEDIUM: "Medium Risk",
  SUPPORTED: "Supported",
  ACCESSIBILITY: "Accessibility",
};

const TONE_COLOR: Record<Issue["severity"], string> = {
  HIGH: C.high,
  MEDIUM: C.medium,
  SUPPORTED: C.ok,
  ACCESSIBILITY: C.a11y,
};

function IconRule() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4.09 12.26a1 1 0 00.82 1.57H11L10.08 22 20 11.74a1 1 0 00-.83-1.57L14 10.13 13 2z" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 2l1.68 5.17L19 8l-5.17 1.68L12 15l-1.68-5.17L5 8l5.17-1.68L12 2z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconWand() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M15 4V2m0 14v-2M8 9H2m14 0h-2M4.22 4.22l1.42 1.42m12.72 12.72l-1.42-1.42M4.22 19.78l1.42-1.42M18.36 5.64l-1.42 1.42" />
    </svg>
  );
}

export default function IssueCard({
  issue,
  active,
  resolved,
  onSelect,
  onApply,
  onDismiss,
}: {
  issue: Issue;
  active: boolean;
  resolved?: "applied" | "dismissed";
  onSelect: () => void;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const toneColor = TONE_COLOR[issue.severity];

  const pct = Number.isFinite(issue.confidence)
  ? Math.round(Math.max(0, Math.min(1, issue.confidence)) * 100)
  : 0;

  const pctColor =
    pct > 90 ? C.ok : pct > 70 ? C.neon : C.medium;

  return (
    <>
      <style>{`
        .ic-wrap {
          position:relative;
          border-radius:16px;
          cursor:pointer;
          overflow:hidden;
          transition:transform .25s ease, box-shadow .25s ease, border-color .25s ease;
        }

        .ic-wrap::before {
          content:'';
          position:absolute;
          inset:0;
          border-radius:16px;
          background:linear-gradient(135deg, rgba(255,107,0,.06) 0%, transparent 60%);
          opacity:0;
          transition:opacity .25s;
          pointer-events:none;
          z-index:0;
        }

        .ic-wrap:hover {
          transform:translateY(-3px);
          box-shadow:0 16px 48px rgba(0,0,0,.65), 0 0 0 1px rgba(255,107,0,.25);
        }

        .ic-wrap:hover::before {
          opacity:1;
        }

        .ic-wrap:hover .ic-inner {
          background:rgba(255,107,0,.045);
        }

        .ic-wrap.ic-active {
          box-shadow:0 0 0 1.5px ${C.neon}, 0 8px 32px rgba(255,107,0,.2);
        }

        .ic-sev-bar {
          position:absolute;
          left:0;
          top:0;
          bottom:0;
          width:3px;
          border-radius:16px 0 0 16px;
        }

        .ic-apply-btn {
          display:inline-flex;
          align-items:center;
          gap:7px;
          padding:9px 18px;
          border-radius:9px;
          font-size:12.5px;
          font-weight:700;
          border:none;
          color:#fff;
          cursor:pointer;
          background:linear-gradient(135deg,#d44a00,${C.neon});
          box-shadow:0 0 16px rgba(255,107,0,.4);
          transition:all .2s ease;
        }

        .ic-apply-btn:hover {
          filter:brightness(1.12);
          transform:translateY(-1px);
          box-shadow:0 0 24px rgba(255,107,0,.6);
        }

        .ic-dismiss-btn {
          display:inline-flex;
          align-items:center;
          gap:7px;
          padding:9px 16px;
          border-radius:9px;
          font-size:12.5px;
          font-weight:600;
          cursor:pointer;
          color:${C.text2};
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.12);
          transition:all .2s ease;
        }

        .ic-dismiss-btn:hover {
          background:rgba(255,255,255,.1);
          color:${C.text};
          border-color:rgba(255,255,255,.25);
        }

        .ic-confidence-track {
          width:52px;
          height:5px;
          border-radius:999px;
          background:rgba(255,255,255,.1);
          overflow:hidden;
        }

        .ic-confidence-fill {
          height:100%;
          border-radius:999px;
          transition:width .7s cubic-bezier(0.16,1,0.3,1);
        }

        .ic-evidence {
          border-left:2px solid ${C.neon};
          padding:10px 14px;
          background:rgba(255,107,0,.06);
          border-radius:0 8px 8px 0;
        }

        .ic-fix-box {
          display:flex;
          gap:10px;
          align-items:flex-start;
          padding:11px 14px;
          border-radius:10px;
          background:rgba(255,149,0,.08);
          border-left:2px solid ${C.yellow};
        }
      `}</style>

      <article
        className={`ic-wrap ${active ? "ic-active" : ""}`}
        onClick={onSelect}
        style={{
          border: `1px solid ${active ? C.neon : C.line}`,
          opacity: resolved ? 0.6 : 1,
        }}
      >
        {/* Severity bar */}
        <div
          className="ic-sev-bar"
          style={{ background: toneColor, opacity: 0.7 }}
        />

        {/* Inner card */}
        <div
          className="ic-inner"
          style={{
            borderRadius: 16,
            padding: "16px 18px 18px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 13,
            background: BG.card,
            transition: "background .25s",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 7,
            }}
          >
            {/* Severity */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 700,
                color: toneColor,
                border: `1px solid ${toneColor}40`,
                background: `${toneColor}12`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: toneColor,
                  flexShrink: 0,
                }}
              />
              {LABEL[issue.severity]}
            </span>

            {/* Type */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                color: C.neon,
                border: `1px solid ${C.neon}30`,
                background: `${C.neon}0d`,
              }}
            >
              {issue.check_type === "RULE" ? <IconRule /> : <IconAI />}
              {issue.check_type === "RULE" ? "Rule" : "AI"}
            </span>

            {/* Ledger badge */}
            {issue.fact_id && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.ok,
                  border: `1px solid ${C.ok}30`,
                  background: `${C.ok}0d`,
                }}
              >
                <IconLink />
                Ledger
              </span>
            )}

            {/* Decision required */}
            {issue.needs_human_decision && !resolved && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: C.yellow,
                  border: `1px solid ${C.yellow}40`,
                  background: `${C.yellow}0d`,
                }}
              >
                <IconUser />
                Decision required
              </span>
            )}

            {/* Confidence */}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
              <div className="ic-confidence-track">
                <div
                  className="ic-confidence-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, pct))}%`,
                    background: pctColor,
                  }}
                />
              </div>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.muted,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 30,
                  textAlign: "right",
                }}
              >
                {pct}%
              </span>
            </div>
          </div>

          {/* Flagged text */}
          <p
            style={{
              margin: 0,
              fontSize: 14.5,
              fontWeight: 700,
              color: C.text,
              lineHeight: 1.5,
            }}
          >
            &ldquo;{issue.flagged_text}&rdquo;
          </p>

          {/* Explanation */}
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              color: C.text2,
              lineHeight: 1.65,
            }}
          >
            {issue.explanation}
          </p>

          {/* Evidence */}
          <div className="ic-evidence">
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontStyle: "italic",
                color: C.text2,
                lineHeight: 1.6,
              }}
            >
              {issue.cited_evidence}
            </p>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: 11,
                color: C.muted,
                fontFamily: "ui-monospace,monospace",
              }}
            >
              {issue.passage_id} · {issue.source_version}
            </p>
          </div>

          {/* Suggested fix */}
          {issue.suggested_fix && (
            <div className="ic-fix-box">
              <span
                style={{
                  color: C.yellow,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <IconWand />
              </span>

              <span style={{ fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ color: C.muted }}>
                  Suggested:{" "}
                </span>

                <span style={{ color: C.text }}>
                  {issue.suggested_fix}
                </span>
              </span>
            </div>
          )}

          {/* Actions */}
          {resolved ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {resolved === "applied" ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={C.ok}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>

                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: C.ok,
                    }}
                  >
                    Fix applied to draft
                  </span>
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={C.muted}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>

                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: C.muted,
                    }}
                  >
                    Dismissed by reviewer
                  </span>
                </>
              )}
            </div>
          ) : issue.suggested_fix || issue.needs_human_decision ? (
            <div
              style={{ display: "flex", gap: 9, flexWrap: "wrap" }}
              onClick={(event) => event.stopPropagation()}
            >
              {/* Apply fix only when one exists */}
              {issue.suggested_fix && (
                <button
                  type="button"
                  className="ic-apply-btn"
                  onClick={onApply}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>

                  Apply fix
                </button>
              )}

              {/* Human review / dismissal */}
              <button
                type="button"
                className="ic-dismiss-btn"
                onClick={onDismiss}
              >
                {issue.suggested_fix ? "Dismiss" : "Mark reviewed"}
              </button>
            </div>
          ) : null}
        </div>
      </article>
    </>
  );
}
