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
  fixAllStalePosts: () => void;
  resetToDemoData: () => void;
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

  // Save changes to localStorage whenever relevant state updates.
  useEffect(() => {
    if (!hydrated) return;

    try {
      const data: PersistedState = {
        facts,
        posts,
        audit,
        analysis,
        applied,
        dismissed,
        approved,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Could not save Guardian AI Ledger:", error);
    }
  }, [
    facts,
    posts,
    audit,
    analysis,
    applied,
    dismissed,
    approved,
    hydrated,
  ]);

  const log = (action: string, detail: string) => {
    const entry: Audit = {
      at: new Date().toLocaleTimeString(),
      actor: "REVIEWER",
      action,
      detail,
    };

    setAudit((old) => [entry, ...old.slice(0, 49)]);
  };

  const recordDecision = (decision: "applied" | "dismissed") => {
    if (decision === "applied") {
      setApplied((count) => count + 1);
    } else {
      setDismissed((count) => count + 1);
    }
  };

  const approveDraft = (content: string, issues: Issue[]) => {
    const linkedFactId =
      issues.find(
        (issue) =>
          issue.severity === "SUPPORTED" &&
          Boolean(issue.fact_id)
      )?.fact_id ?? "fact_starter_price";

    const fact = facts.find((item) => item.id === linkedFactId);
    const priceToken = fact ? `$${fact.value}` : "$29";

    const newPost: Post = {
      id: `post_${Date.now()}`,
      title: "New marketing copy",
      fact_id: linkedFactId,
      text: content,
      token: priceToken,
      status: "approved",
    };

    setPosts((old) => [newPost, ...old]);
    setApproved((count) => count + 1);

    log(
      "Post approved",
      `Approved and saved as ${newPost.id}; linked to ${linkedFactId}.`
    );
  };

  const updateFact = (id: string, value: number) => {
    const fact = facts.find((item) => item.id === id);
    if (!fact) return 0;

    const nextVersion = fact.version + 1;

    setFacts((old) =>
      old.map((item) =>
        item.id === id
          ? {
              ...item,
              value,
              version: nextVersion,
            }
          : item
      )
    );

    const affected = posts.filter((post) => post.fact_id === id);
    const affectedCount = affected.length;

    setPosts((old) =>
      old.map((post) =>
        post.fact_id === id
          ? {
              ...post,
              status: "stale",
            }
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

  const fixAllStalePosts = () => {
    let synced = 0;
    setPosts((old) =>
      old.map((item) => {
        if (item.status !== "stale") return item;
        const fact = facts.find((f) => f.id === item.fact_id);
        if (!fact) return item;
        synced++;
        const updatedText = item.token
          ? item.text.replace(item.token, `$${fact.value}`)
          : item.text;
        return {
          ...item,
          text: updatedText,
          token: `$${fact.value}`,
          status: "approved",
        };
      })
    );
    if (synced > 0) {
      log(
        "All stale posts synchronized",
        `${synced} post(s) automatically synchronized with latest approved fact values.`
      );
    }
  };

  const resetToDemoData = () => {
    setFacts(INITIAL_FACTS);
    setPosts(INITIAL_POSTS);
    setAudit([
      {
        at: new Date().toLocaleTimeString(),
        actor: "SYSTEM",
        action: "Store reset",
        detail: "Ledger reset to initial baseline demo facts and posts.",
      },
    ]);
    setAnalysis(null);
    setApplied(0);
    setDismissed(0);
    setApproved(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
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
        fixAllStalePosts,
        resetToDemoData,
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
