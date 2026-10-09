"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { MessageSquare } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; role: string; sub: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({ sub: data.sub, role: data.role }));
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pub flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pub-accent)]">
            <MessageSquare className="h-8 w-8 text-[var(--pub-panel)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--pub-ink)]">Sign in</h1>
          <p className="mt-2 text-sm text-[var(--pub-ink-2)]">
            Welcome back to the WhatsApp CRM dashboard
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[var(--pub-ink-2)]">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full rounded-md border border-[var(--pub-line-strong)] bg-[var(--pub-panel)] px-3 py-2 text-sm text-[var(--pub-ink)] outline-none focus:border-[var(--pub-accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[var(--pub-ink-2)]">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin"
              className="w-full rounded-md border border-[var(--pub-line-strong)] bg-[var(--pub-panel)] px-3 py-2 text-sm text-[var(--pub-ink)] outline-none focus:border-[var(--pub-accent)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[var(--pub-ink)] py-2.5 text-[14px] font-medium text-[var(--pub-panel)] hover:bg-[#2e2c28] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[var(--pub-ink-3)]">
          Seeded demo credentials:{" "}
          <code className="rounded bg-[var(--pub-panel)] px-1.5 py-0.5 text-[12px] text-[var(--pub-accent)]">
            admin / admin
          </code>
        </p>
      </div>
    </div>
  );
}