"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function DashboardOverview() {
  const [m, setM] = useState<any>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    apiFetch("/api/metrics").then(setM).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="text-sm text-red-600">Metrics unavailable: {err}</div>;
  if (!m) return <div className="text-sm text-gray-500">Loading…</div>;

  const cards = Object.entries(m).slice(0, 12);
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Overview</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([k, v]) => (
          <div key={k} className="rounded border bg-white p-4">
            <div className="text-xs uppercase text-gray-500">{k}</div>
            <div className="text-2xl font-bold">{String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
