"use client";

import { useEffect, useState } from "react";
import { apiFetch, API_BASE } from "@/lib/api";

export default function HealthPage() {
  const [h, setH] = useState<any>(null);
  const [odoo, setOdoo] = useState<any>(null);
  useEffect(() => {
    apiFetch("/health").then(setH).catch(() => setH({ status: "down" }));
    apiFetch("/api/health/odoo").then(setOdoo).catch(() => setOdoo({ status: "down" }));
  }, []);
  const row = (k: string, v: any) => (
    <div className="flex justify-between rounded-2xl border border-b border-borderorder bg-surface p-3 text-sm">
      <span>{k}</span>
      <span className={`font-medium ${String(v?.status) === "ok" ? "text-green-600" : "text-red-600"}`}>{v ? JSON.stringify(v) : "…"}</span>
    </div>
  );
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Health</h1>
      <div className="mb-2 text-xs text-fg-muted">Backend: {API_BASE}</div>
      <div className="flex flex-col gap-2">{row("backend", h)}{row("odoo", odoo)}</div>
    </div>
  );
}
