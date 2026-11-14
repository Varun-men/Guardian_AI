import type { Issue } from "@/lib/types";

const LABEL: Record<Issue["severity"], string> = {
  HIGH: "High Risk",
  MEDIUM: "Medium Risk",
  SUPPORTED: "Supported",
  ACCESSIBILITY: "Accessibility",
};

function getSeverityColor(sev: Issue["severity"]) {
  switch (sev) {
    case "HIGH":
      return "var(--redhi)";
    case "MEDIUM":
      return "#f87171"; // soft crimson instead of orange
    case "ACCESSIBILITY":
      return "var(--yellow)";
    case "SUPPORTED":
    default:
      return "#10b981";
  }
}

function IconRule() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M13 2L4.09 12.26a1 1 0 00.82 1.57H11L10.08 22 20 11.74a1 1 0 00-.83-1.57L14 10.13 13 2z" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2l1.68 5.17L19 8l-5.17 1.68L12 15l-1.68-5.17L5 8l5.17-1.68L12 2z" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconWand() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 4V2m0 14v-2M8 9H2m14 0h-2M4.22 4.22l1.42 1.42m12.72 12.72l-1.42-1.42M4.22 19.78l1.42-1.42M18.36 5.64l-1.42 1.42" />
    </svg>
  );
}

export default function IssueCard({
  issue,
  active,
  resolved,
  canApply,
  onSelect,
  onApply,
  onDismiss,
  facts,
  selectedFactId,
  linkedFactId,
  associating,
  associationError,
  onFactChange,
  onAssociateFact,
  showFactAssociation,
}: {
  issue: Issue;
  active: boolean;
  resolved?: "applied" | "dismissed";
  canApply: boolean;
  onSelect: () => void;
  onApply: () => void;
  onDismiss: () => void;
  facts: {
    id: string;
    name: string;
    value: string;
    source_name: string | null;
  }[];
  selectedFactId: string;
  linkedFactId: string | null;
  associating: boolean;
  associationError: string | null;
  onFactChange: (factId: string) => void;
  onAssociateFact: () => void;
  showFactAssociation: boolean;
}) {
  const toneColor = getSeverityColor(issue.severity);

  const pct = Number.isFinite(issue.confidence)
    ? Math.round(Math.max(0, Math.min(1, issue.confidence)) * 100)
    : 0;

  const pctColor = pct > 90 ? "#10b981" : pct > 70 ? "var(--yellow)" : "var(--redhi)";

  return (
    <>
      <style>{`
        .ic-wrap {
          position: relative;
          background: var(--s1);
          border: 1px solid var(--line);
          border-radius: 16px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.2s var(--ease), border-color 0.2s var(--ease), box-shadow 0.2s var(--ease), background-color 0.2s var(--ease);
        }

        .ic-wrap:hover {
          border-color: rgba(242, 103, 95, 0.45);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }

        .ic-wrap.ic-active {
          border-color: var(--redhi);
          background: rgba(176, 18, 27, 0.1);
          box-shadow: 0 4px 20px rgba(176, 18, 27, 0.25);
        }

        .ic-apply-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 16px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 600;
          border: 1px solid var(--blood);
          color: #fff;
          cursor: pointer;
          background: var(--blood);
          transition: background-color 0.15s var(--ease), transform 0.1s var(--ease);
        }

        .ic-apply-btn:hover {
          background: var(--blood-hover);
        }

        .ic-apply-btn:active {
          transform: scale(0.98);
        }

        .ic-dismiss-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 34px;
          padding: 0 14px;
          border-radius: 999px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          color: var(--t2);
          background: transparent;
          border: 1px solid var(--line);
          transition: background-color 0.15s var(--ease), color 0.15s var(--ease), border-color 0.15s var(--ease);
        }

        .ic-dismiss-btn:hover {
          background: rgba(255, 226, 220, 0.06);
          color: var(--t1);
          border-color: var(--t3);
        }

        .ic-confidence-track {
          width: 48px;
          height: 5px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }

        .ic-confidence-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s var(--ease);
        }

        .ic-evidence {
          border-left: 2px solid var(--redhi);
          padding: 10px 14px;
          background: var(--s2);
          border-radius: 0 10px 10px 0;
        }

        .ic-fix-box {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 10px 14px;
          border-radius: 10px;
          background: var(--s2);
          border-left: 2px solid var(--yellow);
        }
      `}</style>

      <article
        className={`ic-wrap ${active ? "ic-active" : ""}`}
        onClick={onSelect}
        style={{
          opacity: resolved ? 0.6 : 1,
        }}
      >
        {/* Severity indicator accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3.5,
            background: toneColor,
          }}
        />

        {/* Card Body */}
        <div
          style={{
            padding: "16px 18px 18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Severity Pill */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 600,
                color: "var(--t1)",
                border: "1px solid var(--line)",
                background: "rgba(255, 255, 255, 0.04)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: toneColor,
                  flexShrink: 0,
                }}
              />
              {LABEL[issue.severity]}
            </span>

            {/* Check Type */}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 500,
                color: "var(--t2)",
                border: "1px solid var(--line)",
                background: "rgba(255, 255, 255, 0.02)",
                fontFamily: "var(--mono)",
              }}
            >
              {issue.check_type === "RULE" ? <IconRule /> : <IconAI />}
              {issue.check_type === "RULE" ? "Rule" : "AI Citation"}
            </span>

            {/* Ledger Linked Badge */}
            {(linkedFactId || issue.fact_id) && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: "#10b981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  background: "rgba(16, 185, 129, 0.08)",
                  fontFamily: "var(--mono)",
                }}
              >
                <IconLink />
                Ledger Linked
              </span>
            )}

            {/* Decision Required Badge */}
            {issue.needs_human_decision && !resolved && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--redhi)",
                  border: "1px solid rgba(242, 103, 95, 0.3)",
                  background: "rgba(176, 18, 27, 0.15)",
                }}
              >
                <IconUser />
                Decision Required
              </span>
            )}

            {/* Confidence Score */}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 7,
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
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: "var(--t3)",
                  fontFamily: "var(--mono)",
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 30,
                  textAlign: "right",
                }}
              >
                {pct}%
              </span>
            </div>
          </div>

          {/* Flagged Claim Quote */}
          <div
            style={{
              padding: "10px 14px",
              background: "var(--s2)",
              borderRadius: 10,
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--t1)",
              border: "1px solid var(--line)",
            }}
          >
            <span style={{ color: "var(--t3)", fontFamily: "var(--mono)", fontSize: 12, marginRight: 6 }}>
              Claim:
            </span>
            <mark
              style={{
                color: "inherit",
                padding: "1px 4px",
                borderBottom: "2px solid var(--redhi)",
                background: "rgba(242, 109, 99, 0.18)",
                borderRadius: 2,
              }}
            >
              &ldquo;{issue.flagged_text}&rdquo;
            </mark>
          </div>

          {/* Explanation */}
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              color: "var(--t2)",
              lineHeight: 1.55,
            }}
          >
            {issue.explanation}
          </p>

          {/* Cited Evidence */}
          <div className="ic-evidence">
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--t1)",
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              &ldquo;{issue.cited_evidence}&rdquo;
            </p>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: 11,
                color: "var(--t3)",
                fontFamily: "var(--mono)",
              }}
            >
              Source: {issue.passage_id} · v{issue.source_version}
            </p>
          </div>
                    {/* Fact Association */}
          {showFactAssociation && (
            <div
              onClick={(event) => event.stopPropagation()}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--line)",
                background: "var(--s1)",
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "var(--t3)",
                  fontFamily: "var(--mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Link verified evidence to a ledger fact
              </span>

              {linkedFactId ? (
                <span style={{ color: "#10b981", fontSize: 12 }}>
                  Fact successfully linked: {linkedFactId}
                </span>
              ) : (
                <>
                  <select
                    value={selectedFactId}
                    onChange={(event) => onFactChange(event.target.value)}
                    disabled={associating || facts.length === 0}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      background: "var(--s2)",
                      color: "var(--t1)",
                      border: "1px solid var(--line)",
                      fontSize: 13,
                    }}
                  >
                    <option value="">
                      {facts.length
                        ? "Select a matching ledger fact"
                        : "No matching active facts available"}
                    </option>

                    {facts.map((fact) => (
                      <option key={fact.id} value={fact.id}>
                        {fact.name} — {fact.value}
                        {fact.source_name ? ` (${fact.source_name})` : ""}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={!selectedFactId || associating}
                    onClick={onAssociateFact}
                    style={{
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "none",
                      background: "var(--blood)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor:
                        !selectedFactId || associating
                          ? "not-allowed"
                          : "pointer",
                      opacity: !selectedFactId || associating ? 0.5 : 1,
                    }}
                  >
                    {associating ? "Linking..." : "Link Fact"}
                  </button>
                </>
              )}

              {associationError && (
                <span style={{ color: "var(--redhi)", fontSize: 12 }}>
                  {associationError}
                </span>
              )}
            </div>
          )}

          {/* Suggested Revision Box */}
          {issue.suggested_fix && (
            <div className="ic-fix-box">
              <span
                style={{
                  color: "var(--yellow)",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                <IconWand />
              </span>

              <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                <span style={{ color: "var(--t3)", fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 2 }}>
                  Suggested revision
                </span>
                <span style={{ color: "var(--t1)", fontWeight: 500 }}>
                  {issue.suggested_fix}
                </span>
              </div>
            </div>
          )}

          {/* Asset-level accessibility note */}
          {!resolved && !canApply && issue.suggested_fix && (
            <div
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                background: "rgba(245, 184, 46, 0.08)",
                border: "1px solid rgba(245, 184, 46, 0.2)",
                color: "var(--yellow)",
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              Image alt text attribute must be set directly on the asset before publishing.
            </div>
          )}

          {/* Actions Bar */}
          {resolved ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingTop: 2,
              }}
            >
              {resolved === "applied" ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#10b981" }}>
                    Fix applied to draft
                  </span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--t3)" }}>
                    Dismissed by reviewer
                  </span>
                </>
              )}
            </div>
          ) : issue.suggested_fix || issue.needs_human_decision ? (
            <div
              style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 2 }}
              onClick={(event) => event.stopPropagation()}
            >
              {issue.suggested_fix && canApply && (
                <button
                  type="button"
                  className="ic-apply-btn"
                  onClick={onApply}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Apply fix
                </button>
              )}

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
