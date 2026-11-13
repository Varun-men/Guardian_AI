"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DemoRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/analyze");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ink)",
        fontFamily: "var(--sans)",
      }}
    >
      <p style={{ color: "var(--t3)", fontSize: 15, fontFamily: "var(--mono)" }}>
        Redirecting to live analyzer…
      </p>
    </div>
  );
}
