"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function AuditPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { apiFetch("/api/audit").then(setRows).catch(() => setRows([])); }, []);
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Audit Log</h1>
      <div className="flex flex-col gap-1 text-xs">
        {rows.map((a) => (
          <div key={a.id} className="rounded border bg-white p-2 font-mono">
            {new Date(a.createdAt).toLocaleString()} · {a.action} · {a.entity}:{String(a.entityId ?? "").slice(0, 8)} · {a.actor ?? "system"}
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-gray-500">No audit rows yet.</div>}
      </div>
    </div>
  );
}
