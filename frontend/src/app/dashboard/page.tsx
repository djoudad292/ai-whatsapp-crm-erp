"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Activity, AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";

const ICONS = [Activity, MessageSquare, CheckCircle2, AlertTriangle];

export default function DashboardOverview() {
  const [m, setM] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch("/api/metrics").then(setM).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm">Metrics unavailable: {err}</div>;
  if (!m) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    );
  }

  const cards = Object.entries(m).slice(0, 12);
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight">Overview</h1>
        <p className="text-sm text-fg-muted">Live pipeline counters from the integration backend.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([k, v], i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <div key={k} className="rounded-2xl border border-border bg-surface p-4 shadow-card">
              <div className="mb-2 flex items-center gap-2 text-fg-muted">
                <Icon size={15} />
                <span className="break-words text-[11px] uppercase leading-tight tracking-wide">{k}</span>
              </div>
              <div className="text-2xl font-bold tracking-tight">{String(v)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
