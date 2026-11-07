
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "error">(
    "checking"
  );
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      const token = localStorage.getItem("guardian_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("guardian_token");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Could not validate your session.");
        }

        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, [router, retry]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verifying your session...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p>Unable to connect to Guardian AI backend.</p>
        <button onClick={() => {
          setStatus("checking");
          setRetry((value) => value + 1);
        }}>
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
