
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const ACCESS_TOKEN_KEY = "guardian_token";
const CSRF_COOKIE = "guardian_csrf";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function isDemoSession(token: string | null = getAccessToken()): boolean {
  return !!token && token.startsWith("demo");
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CSRF_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

// Single in-flight refresh shared by all concurrent requests.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRF-Token": getCsrfToken() },
        });

        if (!response.ok) return null;

        const data = await response.json().catch(() => null);
        if (!data?.access_token) return null;

        localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
        return data.access_token as string;
      } catch {
        return null;
      } finally {
        // Allow a later refresh once this one settles.
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      }
    })();
  }

  return refreshPromise;
}

/** Revoke the refresh token server-side, then clear local state. */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Server unreachable — still clear local state below.
  } finally {
    clearSession();
  }
}

async function request(
  path: string,
  options: RequestInit,
  token: string | null
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(typeof FormData !== "undefined" && options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = getAccessToken();

  let response = await request(path, options, token);

  // On 401 with a real (non-demo) token, try one silent refresh
  // and retry the original request exactly once.
  if (response.status === 401 && token && !isDemoSession(token)) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      response = await request(path, options, newToken);

      // Retried request still unauthorized: session is dead.
      if (response.status === 401) {
        clearSession();
        redirectToLogin();
      }
    } else {
      clearSession();
      redirectToLogin();
      const data = await response.json().catch(() => null);
      throw new ApiError(
        data?.detail ?? "Session expired. Please sign in again.",
        401
      );
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? `Request failed (${response.status})`,
      response.status
    );
  }

  return data;
}
