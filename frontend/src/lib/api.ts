/**
 * API client helper.
 *
 * Backend base URL comes from env NEXT_PUBLIC_API_URL. It may be:
 *   - an absolute origin (http://localhost:3000, https://api.example.com)
 *   - a root-relative path ("/") or a placeholder (".", "") meaning
 *     "same origin as the site".
 *
 * Relative bases are always resolved against the site origin, never the
 * current route: a bare "." would otherwise turn "/api/orders" into
 * "/dashboard/api/orders" on nested pages like /dashboard/orders.
 * All dashboard routes are client components, so this module is safe to
 * import from "use client" files.
 */

const RAW_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");

export const API_BASE = /^https?:\/\//i.test(RAW_BASE) ? RAW_BASE : "";

/** Append a token from localStorage to a request when one is present. */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/** Fetch JSON from the backend, throwing on non-2xx responses. */
export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: authHeaders(init.headers as Record<string, string>),
  });

  let body: any = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && typeof body.message === "string"
        ? body.message
        : typeof body === "string"
          ? body
          : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}