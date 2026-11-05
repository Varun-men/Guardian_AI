// Mirrors the frozen POST /api/review/analyze contract. Ledger link field is `fact_id` everywhere.
export type Severity = "HIGH" | "MEDIUM" | "SUPPORTED" | "ACCESSIBILITY";
export interface Issue {
  id: string; claim_id: string | null; severity: Severity; category: string;
  check_type: "RULE" | "AI"; flagged_text: string; passage_id: string; source_version: string;
  cited_evidence: string; explanation: string; suggested_fix: string | null;
  confidence: number; needs_human_decision: boolean; fact_id: string | null;
}
export interface AnalyzeResponse { draft_id: string; content: string; status: string; issues: Issue[]; }
