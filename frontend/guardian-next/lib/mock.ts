import type { AnalyzeResponse } from "./types";
// Swap for: fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/review/analyze`, { method: "POST", ... })
export const mockAnalyze: AnalyzeResponse = {
  draft_id: "uuid-1234",
  content: "Meet Orbit. Our app is 3x faster than any competitor. Plans start at $29.",
  status: "in_review",
  issues: [
    { id: "iss_1", claim_id: "clm_1", severity: "HIGH", category: "COMPARATIVE_CLAIM", check_type: "AI",
      flagged_text: "Our app is 3x faster than any competitor.", passage_id: "POLICY_V2_SEC_4", source_version: "v2",
      cited_evidence: "All comparative claims require a documented benchmark.",
      explanation: "No approved benchmark found in knowledge base.", suggested_fix: "Our app is built for speed.",
      confidence: 0.82, needs_human_decision: true, fact_id: null },
    { id: "iss_2", claim_id: "clm_2", severity: "SUPPORTED", category: "APPROVED_VALUE", check_type: "RULE",
      flagged_text: "Plans start at $29.", passage_id: "PRICING_V2", source_version: "v2",
      cited_evidence: "Starter plan: $29/mo", explanation: "Matches Pricing Sheet v2 (verified).",
      suggested_fix: null, confidence: 1.0, needs_human_decision: false, fact_id: "fact_starter_price" },
    { id: "iss_3", claim_id: null, severity: "ACCESSIBILITY", category: "MISSING_ALT_TEXT", check_type: "RULE",
      flagged_text: "orbit-hero.png", passage_id: "WCAG_1_1_1", source_version: "v1",
      cited_evidence: "Images need a text alternative.", explanation: "Deterministic check: image has no alt text.",
      suggested_fix: "Add a short description of the image.", confidence: 1.0, needs_human_decision: false, fact_id: null },
  ],
};
