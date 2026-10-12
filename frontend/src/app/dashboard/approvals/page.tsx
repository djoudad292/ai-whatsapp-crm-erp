"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ApprovalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    setRows(await apiFetch("/api/approvals?status=pending").catch(() => []));
  }
  useEffect(() => { load(); }, []);

  async function decide(id: string, how: "approve" | "reject") {
    setMsg("");
    try {
      await apiFetch(`/api/approvals/${id}/${how}`, { method: "POST", body: "{}" });
      setMsg(`${how}d ${id.slice(0, 8)}`);
      load();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Approvals</h1>
      {msg && <div className="mb-2 text-sm text-fg-secondary">{msg}</div>}
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-2xl border border-b border-borderorder bg-surface p-3 text-sm">
            <div>
              <span className="font-medium">{r.type}</span> · order {String(r.orderId).slice(0, 8)} · {r.amount ?? ""} · {r.reason ?? ""}
              <div className="text-xs text-fg-muted">{r.status} · {new Date(r.createdAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => decide(r.id, "approve")} className="rounded-lg bg-success px-3 py-1 font-medium text-white">Approve</button>
              <button onClick={() => decide(r.id, "reject")} className="rounded-lg bg-danger px-3 py-1 font-medium text-white">Reject</button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-fg-muted">No pending approvals.</div>}
      </div>
    </div>
  );
}
