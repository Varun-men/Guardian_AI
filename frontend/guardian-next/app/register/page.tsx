"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const effectiveEmail = email.trim() || `${username.trim()}@guardian-ai.local`;
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: effectiveEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 || data.detail?.includes("already exists")) {
          throw new Error("This username or email is already registered. Please sign in or choose another.");
        }
        throw new Error(data.detail ?? "Registration failed");
      }

      localStorage.setItem("guardian_token", data.access_token);
      router.replace("/analyze");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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

      {/* Register card */}
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
          <svg width="38" height="38" viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" fill="#B0121B"/>
            <path d="M16 2L4 7v9c0 6.6 5.1 12.8 12 14.3C22.9 28.8 28 22.6 28 16V7L16 2z" stroke="#F2675F" strokeWidth="0.5" fill="none" opacity="0.4"/>
            <path d="M11 16l3.5 3.5L21 12" stroke="#F7ECE8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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
            Create your account
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--t3)", letterSpacing: "0.04em", margin: 0 }}>
            REGISTER · OR{" "}
            <Link href="/login" style={{ color: "var(--redhi)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              SIGN IN
            </Link>
          </p>
        </div>

        <form onSubmit={register} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "var(--s2)",
                border: "1px solid var(--line)",
                color: "var(--t1)",
                fontSize: "14px",
                fontFamily: "var(--mono)",
                outline: "none",
                transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--blood)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
              placeholder="yourname"
            />
          </div>

          {/* Email (display only, optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="email"
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--t3)",
              }}
            >
              Email <span style={{ opacity: 0.5, fontSize: 10 }}>(optional)</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "var(--s2)",
                border: "1px solid var(--line)",
                color: "var(--t1)",
                fontSize: "14px",
                fontFamily: "var(--mono)",
                outline: "none",
                transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--blood)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
              placeholder="you@example.com"
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "var(--s2)",
                border: "1px solid var(--line)",
                color: "var(--t1)",
                fontSize: "14px",
                fontFamily: "var(--mono)",
                outline: "none",
                transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--blood)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              htmlFor="confirmPassword"
              style={{
                fontFamily: "var(--mono)",
                fontSize: "11px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--t3)",
              }}
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "var(--s2)",
                border: "1px solid var(--line)",
                color: "var(--t1)",
                fontSize: "14px",
                fontFamily: "var(--mono)",
                outline: "none",
                transition: "border-color 0.15s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--blood)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
              placeholder="••••••••"
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "10px",
                background: "rgba(176,18,27,0.12)",
                border: "1px solid rgba(176,18,27,0.3)",
                color: "#F2675F",
                fontSize: "13px",
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
              width: "100%",
              padding: "14px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #8c0e15, #b0121b)",
              border: "none",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.75 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 0.15s",
              marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.75s linear infinite",
                    display: "inline-block",
                  }}
                />
                Creating account...
              </>
            ) : (
              "Create account"
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
            or try instant test without registering →
          </Link>
          <Link
            href="/login"
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
            Already have an account? Sign in →
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
