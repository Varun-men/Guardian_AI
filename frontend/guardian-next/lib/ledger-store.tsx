"use client";
import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AnalyzeResponse, Issue, Severity } from "./types";

type Fact = { id: string; label: string; value: number; version: number };
type Post = { id: string; title: string; fact_id: string; text: string; token: string; status: "approved" | "stale" };
type Audit = { at: string; actor: string; action: string; detail: string };
type Stats = { bySeverity: Record<Severity, number>; applied: number; dismissed: number; approved: number };
type Store = {
  facts: Fact[]; posts: Post[]; audit: Audit[]; staleCount: number;
  analysis: AnalyzeResponse | null; stats: Stats;
  setAnalysis: (a: AnalyzeResponse) => void;
  recordDecision: (d: "applied" | "dismissed") => void;
  approveDraft: (content: string, issues: Issue[]) => void;
  updateFact: (id: string, value: number) => number;
  isStale: (p: Post) => boolean; fixPost: (id: string) => void;
};
const Ctx = createContext<Store | null>(null);

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [facts, setFacts] = useState<Fact[]>([
    { id: "fact_starter_price", label: "Starter plan", value: 29, version: 2 },
    { id: "fact_pro_price", label: "Pro plan", value: 79, version: 2 },
  ]);
  // Starter launch post is created only when a draft is approved.
  const [posts, setPosts] = useState<Post[]>([
    { id: "post_pro", title: "Orbit Pro announcement", fact_id: "fact_pro_price", text: "Upgrade to Orbit Pro for $79 per month.", token: "$79", status: "approved" },
  ]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [applied, setApplied] = useState(0);
  const [dismissed, setDismissed] = useState(0);
  const [approved, setApproved] = useState(0);
  const log = (action: string, detail: string) => setAudit(old => [
    { at: new Date().toLocaleString(), actor: "Reviewer", action, detail }, ...old,
  ]);
  const recordDecision = (d: "applied" | "dismissed") => {
    d === "applied" ? setApplied(n => n + 1) : setDismissed(n => n + 1);
    log(d === "applied" ? "Fix applied" : "Finding dismissed", "Reviewer recorded a decision.");
  };
  const approveDraft = (content: string, issues: Issue[]) => {
    const factId = issues.find(i => i.fact_id)?.fact_id ?? "";
    const fact = facts.find(f => f.id === factId);
    setPosts(old => [...old, {
      id: `post_${Date.now()}`, title: "Approved draft", fact_id: factId,
      text: content, token: fact ? `$${fact.value}` : "", status: "approved",
    }]);
    setApproved(n => n + 1);
    log("Draft approved", `Draft added to the Living Ledger${fact ? ` and linked to ${fact.label}` : ""}.`);
  };
  const updateFact = (id: string, value: number) => {
    const fact = facts.find(f => f.id === id);
    if (!fact || !Number.isFinite(value) || value <= 0 || value === fact.value) return 0;
    const count = posts.filter(p => p.fact_id === id && p.status === "approved").length;
    setFacts(old => old.map(f => f.id === id ? { ...f, value, version: f.version + 1 } : f));
    setPosts(old => old.map(p => p.fact_id === id && p.status === "approved" ? { ...p, status: "stale" } : p));
    log("Fact changed", `${fact.label}: $${fact.value} → $${value}; ${count} post(s) marked stale.`);
    return count;
  };
  const isStale = (p: Post) => p.status === "stale";
  const fixPost = (id: string) => {
    const post = posts.find(p => p.id === id);
    if (!post || post.status !== "stale") return;
    const fact = facts.find(f => f.id === post.fact_id);
    if (!fact) return;
    const text = post.text.replace(/\$\d+(?:\.\d{1,2})?/, `$${fact.value}`);
    setPosts(old => old.map(p => p.id === id ? { ...p, text, token: `$${fact.value}`, status: "approved" } : p));
    log("Post updated and approved", `${post.title} updated to $${fact.value}.`);
  };
  const staleCount = posts.filter(p => p.status === "stale").length;
  const stats = useMemo<Stats>(() => {
    const bySeverity: Record<Severity, number> = { HIGH: 0, MEDIUM: 0, SUPPORTED: 0, ACCESSIBILITY: 0 };
    (analysis?.issues ?? []).forEach(i => bySeverity[i.severity]++);
    return { bySeverity, applied, dismissed, approved };
  }, [analysis, applied, dismissed, approved]);
  return <Ctx.Provider value={{ facts, posts, audit, staleCount, analysis, stats, setAnalysis, recordDecision, approveDraft, updateFact, isStale, fixPost }}>{children}</Ctx.Provider>;
}
export function useLedger() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useLedger must be used inside LedgerProvider");
  return value;
}
export const useLedgerStore = useLedger;
