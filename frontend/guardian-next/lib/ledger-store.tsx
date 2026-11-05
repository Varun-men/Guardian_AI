
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { AnalyzeResponse, Issue, Severity } from "./types";

type Fact = {
  id: string;
  label: string;
  value: number;
  version: number;
};

type Post = {
  id: string;
  title: string;
  fact_id: string;
  text: string;
  token: string;
  status: "approved" | "stale";
};

type Audit = {
  at: string;
  actor: string;
  action: string;
  detail: string;
};

type Stats = {
  bySeverity: Record<Severity, number>;
  applied: number;
  dismissed: number;
  approved: number;
};

type PersistedState = {
  facts: Fact[];
  posts: Post[];
  audit: Audit[];
  analysis: AnalyzeResponse | null;
  applied: number;
  dismissed: number;
  approved: number;
};

type Store = {
  facts: Fact[];
  posts: Post[];
  audit: Audit[];
  staleCount: number;
  analysis: AnalyzeResponse | null;
  stats: Stats;
  setAnalysis: (a: AnalyzeResponse) => void;
  recordDecision: (d: "applied" | "dismissed") => void;
  approveDraft: (content: string, issues: Issue[]) => void;
  updateFact: (id: string, value: number) => number;
  isStale: (p: Post) => boolean;
  fixPost: (id: string) => void;
};

const STORAGE_KEY = "guardian-ai-ledger-v1";

const INITIAL_FACTS: Fact[] = [
  {
    id: "fact_starter_price",
    label: "Starter plan",
    value: 29,
    version: 2,
  },
  {
    id: "fact_pro_price",
    label: "Pro plan",
    value: 79,
    version: 2,
  },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "post_pro",
    title: "Orbit Pro announcement",
    fact_id: "fact_pro_price",
    text: "Upgrade to Orbit Pro for $79 per month.",
    token: "$79",
    status: "approved",
  },
];

const Ctx = createContext<Store | null>(null);

export function LedgerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [facts, setFacts] = useState<Fact[]>(INITIAL_FACTS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);

  const [applied, setApplied] = useState(0);
  const [dismissed, setDismissed] = useState(0);
  const [approved, setApproved] = useState(0);

  const [hydrated, setHydrated] = useState(false);

  // Restore saved data once when the application loads.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const data = JSON.parse(saved) as PersistedState;

        if (
          Array.isArray(data.facts) &&
          Array.isArray(data.posts) &&
          Array.isArray(data.audit)
        ) {
          setFacts(data.facts);
          setPosts(data.posts);
          setAudit(data.audit);
          setAnalysis(data.analysis ?? null);
          setApplied(data.applied ?? 0);
          setDismissed(data.dismissed ?? 0);
          setApproved(data.approved ?? 0);
        }
      }
    } catch (error) {
      console.error("Could not restore Guardian AI Ledger:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save changes only after restoration has finished.
  useEffect(() => {
    if (!hydrated) return;

    const data: PersistedState = {
      facts,
      posts,
      audit,
      analysis,
      applied,
      dismissed,
      approved,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save Guardian AI Ledger:", error);
    }
  }, [
    hydrated,
    facts,
    posts,
    audit,
    analysis,
    applied,
    dismissed,
    approved,
  ]);

  const log = (action: string, detail: string) => {
    setAudit((old) => [
      {
        at: new Date().toISOString(),
        actor: "Reviewer",
        action,
        detail,
      },
      ...old,
    ]);
  };

  const recordDecision = (decision: "applied" | "dismissed") => {
    if (decision === "applied") {
      setApplied((count) => count + 1);
    } else {
      setDismissed((count) => count + 1);
    }

    log(
      decision === "applied" ? "Fix applied" : "Finding dismissed",
      `Reviewer recorded a ${decision} decision.`
    );
  };

  const approveDraft = (content: string, issues: Issue[]) => {
    // Link only when an issue explicitly references a known fact
    // and its flagged currency amount actually appears in the draft.
    const linkedIssue = issues.find((issue) => {
      if (!issue.fact_id || !issue.flagged_text) return false;

      const factExists = facts.some(
        (fact) => fact.id === issue.fact_id
      );

      const amount = issue.flagged_text.match(
        /\$\d+(?:\.\d{1,2})?/
      );

      return Boolean(
        factExists && amount && content.includes(amount[0])
      );
    });

    const fact = linkedIssue
      ? facts.find((item) => item.id === linkedIssue.fact_id)
      : undefined;

    const originalToken = linkedIssue?.flagged_text.match(
      /\$\d+(?:\.\d{1,2})?/
    )?.[0];

    const factId = fact && originalToken ? fact.id : "";

    const token = factId && fact
      ? `$${fact.value}`
      : "";

    const linkedText =
      fact && originalToken
        ? content.replace(originalToken, token)
        : content;

    const post: Post = {
      id: `post_${Date.now()}`,
      title: "Approved draft",
      fact_id: factId,
      text: linkedText,
      token,
      status: "approved",
    };

    setPosts((old) => [...old, post]);
    setApproved((count) => count + 1);

    log(
      "Draft approved",
      factId && fact
        ? `Draft approved and linked to ${fact.label}.`
        : "Draft approved without a verified fact link."
    );
  };

  const updateFact = (id: string, value: number): number => {
    const fact = facts.find((item) => item.id === id);

    if (
      !fact ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value === fact.value
    ) {
      return 0;
    }

    const affectedCount = posts.filter(
      (post) =>
        post.fact_id === id && post.status === "approved"
    ).length;

    setFacts((old) =>
      old.map((item) =>
        item.id === id
          ? {
              ...item,
              value,
              version: item.version + 1,
            }
          : item
      )
    );

    setPosts((old) =>
      old.map((post) =>
        post.fact_id === id && post.status === "approved"
          ? { ...post, status: "stale" }
          : post
      )
    );

    log(
      "Fact changed",
      `${fact.label}: $${fact.value} → $${value}; ${affectedCount} post(s) marked stale.`
    );

    return affectedCount;
  };

  const isStale = (post: Post) => post.status === "stale";

  const fixPost = (id: string) => {
    const post = posts.find((item) => item.id === id);

    if (!post || post.status !== "stale") return;

    const fact = facts.find((item) => item.id === post.fact_id);

    if (!fact) return;

    const updatedText = post.token
      ? post.text.replace(post.token, `$${fact.value}`)
      : post.text;

    setPosts((old) =>
      old.map((item) =>
        item.id === id
          ? {
              ...item,
              text: updatedText,
              token: `$${fact.value}`,
              status: "approved",
            }
          : item
      )
    );

    log(
      "Post updated and approved",
      `${post.title} synchronized with ${fact.label} at $${fact.value}.`
    );
  };

  const staleCount = posts.filter(
    (post) => post.status === "stale"
  ).length;

  const stats = useMemo<Stats>(() => {
    const bySeverity: Record<Severity, number> = {
      HIGH: 0,
      MEDIUM: 0,
      SUPPORTED: 0,
      ACCESSIBILITY: 0,
    };

    (analysis?.issues ?? []).forEach((issue) => {
      bySeverity[issue.severity]++;
    });

    return {
      bySeverity,
      applied,
      dismissed,
      approved,
    };
  }, [analysis, applied, dismissed, approved]);

  return (
    <Ctx.Provider
      value={{
        facts,
        posts,
        audit,
        staleCount,
        analysis,
        stats,
        setAnalysis,
        recordDecision,
        approveDraft,
        updateFact,
        isStale,
        fixPost,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useLedger() {
  const value = useContext(Ctx);

  if (!value) {
    throw new Error("useLedger must be used inside LedgerProvider");
  }

  return value;
}

export const useLedgerStore = useLedger;
