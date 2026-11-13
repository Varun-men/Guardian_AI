"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [status, setStatus] = useState<"checking" | "ready" | "error">("checking");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      const token = localStorage.getItem("guardian_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      // Allow instant access for demo tokens
      if (token.startsWith("demo")) {
        if (!cancelled) setStatus("ready");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("guardian_token");
          router.replace("/login");
          return;
        }

        if (!response.ok) throw new Error("Could not validate your session.");
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    validateSession();
    return () => { cancelled = true; };
  }, [router, retry, path]);

  if (status === "checking") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--ink)", gap: 16 }}>
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B" opacity="0.9"/>
          <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--t3)", letterSpacing: "0.08em" }}>VERIFYING SESSION...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--ink)", gap: 20 }}>
        <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
          <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#3A080C" stroke="#B0121B" strokeWidth="1.5"/>
          <path d="M16 11v5M16 20h.01" stroke="#F2675F" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <p style={{ color: "var(--t1)", fontWeight: 600, fontSize: 15, margin: "0 0 6px" }}>Unable to connect</p>
          <p style={{ color: "var(--t3)", fontSize: 13, margin: 0, fontFamily: "var(--mono)" }}>Guardian AI backend is unreachable</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => { setStatus("checking"); setRetry(v => v + 1); }}
            style={{ padding: "10px 20px", borderRadius: 10, background: "var(--blood)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
          >
            Retry connection
          </button>
          <button
            onClick={() => {
              localStorage.setItem("guardian_token", "demo_guest_session");
              setStatus("ready");
            }}
            style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,226,220,0.08)", color: "var(--t1)", border: "1px solid var(--line)", cursor: "pointer", fontSize: 14, fontWeight: 500 }}
          >
            Continue in Demo Mode →
          </button>
          <a href="/login" style={{ padding: "10px 20px", borderRadius: 10, background: "var(--s1)", color: "var(--t2)", border: "1px solid var(--line)", textDecoration: "none", fontSize: 14 }}>
            Sign in again
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
