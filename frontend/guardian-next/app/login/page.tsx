"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail ?? "Login failed");
      }

      localStorage.setItem("guardian_token", data.access_token);
      router.replace("/analyze");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--ink)" }}
    >
      {/* Background glow orbs */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(700px, 100vw)",
          height: "min(700px, 100vw)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(176,18,27,0.14) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "5%",
          right: "10%",
          width: "min(400px, 60vw)",
          height: "min(400px, 60vw)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(176,18,27,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />

      {/* Decorative SVG ring */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "min(900px, 130vw)",
          transform: "translate(-50%, -50%)",
          opacity: 0.08,
          pointerEvents: "none",
        }}
        viewBox="0 0 900 900"
        fill="none"
      >
        <circle cx="450" cy="450" r="420" stroke="#F7ECE8" strokeWidth="1" />
        <circle cx="450" cy="450" r="310" stroke="#F7ECE8" strokeWidth="0.6" />
        <circle cx="450" cy="450" r="200" stroke="#F7ECE8" strokeWidth="0.4" />
      </svg>

      {/* Login card */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "440px",
          background: "var(--s1)",
          border: "1px solid var(--line)",
          borderRadius: "24px",
          padding: "clamp(28px, 5vw, 48px)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(176,18,27,0.08)",
        }}
      >
        {/* Logo mark */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "32px",
            textDecoration: "none",
          }}
        >
          <span
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #8c0e15, #b0121b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "16px",
              color: "#fff",
              boxShadow: "0 0 18px rgba(176,18,27,0.5)",
              flexShrink: 0,
            }}
          >
            G
          </span>
          <span
            style={{
              fontFamily: "var(--sans)",
              fontWeight: 600,
              fontSize: "15px",
              letterSpacing: "-0.01em",
              color: "var(--t1)",
            }}
          >
            GUARDIAN <span style={{ color: "var(--blood)" }}>AI</span>
          </span>
        </Link>

        <div style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "clamp(24px, 5vw, 32px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              color: "var(--t1)",
              margin: "0 0 8px",
              lineHeight: 1.15,
            }}
          >
            Sign in to your workspace
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--t3)", letterSpacing: "0.04em", margin: 0 }}>
            SIGN IN · OR{" "}
            <Link href="/register" style={{ color: "var(--redhi)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              CREATE AN ACCOUNT
            </Link>
          </p>
        </div>

        <form onSubmit={login} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Username */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="username"
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--t3)",
              }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="your-username"
              style={{
                background: "var(--s2)",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "15px",
                color: "var(--t1)",
                fontFamily: "var(--sans)",
                outline: "none",
                transition: "border-color 0.15s ease",
                width: "100%",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(176,18,27,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
            />
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="password"
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--t3)",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                background: "var(--s2)",
                border: "1px solid var(--line)",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "15px",
                color: "var(--t1)",
                fontFamily: "var(--sans)",
                outline: "none",
                transition: "border-color 0.15s ease",
                width: "100%",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(176,18,27,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              style={{
                background: "rgba(176,18,27,0.12)",
                border: "1px solid rgba(176,18,27,0.4)",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "var(--redhi)",
                fontFamily: "var(--mono)",
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "4px",
              width: "100%",
              height: "48px",
              borderRadius: "10px",
              background: loading
                ? "rgba(176,18,27,0.5)"
                : "linear-gradient(135deg, #8c0e15 0%, #b0121b 100%)",
              color: "#fff",
              fontFamily: "var(--sans)",
              fontWeight: 600,
              fontSize: "15px",
              letterSpacing: "-0.01em",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 0 24px rgba(176,18,27,0.4)",
              transition: "opacity 0.15s ease, box-shadow 0.15s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.75s linear infinite",
                    display: "inline-block",
                  }}
                />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>

          {/* Quick Demo Access Button */}
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("guardian_token", "demo_guest_session");
              router.replace("/analyze");
            }}
            style={{
              width: "100%",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(255, 226, 220, 0.05)",
              border: "1px solid var(--line)",
              color: "var(--t2)",
              fontFamily: "var(--mono)",
              fontSize: "12.5px",
              letterSpacing: "0.04em",
              cursor: "pointer",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--t3)"; e.currentTarget.style.color = "var(--t1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--t2)"; }}
          >
            Instant Test / Guest Access →
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/analyze"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "12px",
              color: "var(--t3)",
              letterSpacing: "0.04em",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--t1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--t3)"; }}
          >
            Instant analyzer test →
          </Link>
          <Link
            href="/register"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "12px",
              color: "var(--t3)",
              letterSpacing: "0.04em",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--t1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--t3)"; }}
          >
            Create account →
          </Link>
          <Link
            href="/"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "12px",
              color: "var(--t3)",
              letterSpacing: "0.04em",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--t1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--t3)"; }}
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
