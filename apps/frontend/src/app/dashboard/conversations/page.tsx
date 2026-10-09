"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ConversationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/api/conversations").then(setRows).catch(() => setRows([]));
  }, []);

  async function show(c: any) {
    setOpen(c);
    setMsgs(await apiFetch(`/api/conversations/${c.id}/messages`).catch(() => []));
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Conversations</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          {rows.map((c) => (
            <button key={c.id} onClick={() => show(c)} className="rounded border bg-white p-3 text-left text-sm hover:border-blue-400">
              <div className="font-medium">{c.externalId} <span className="text-xs text-gray-500">({c.channel})</span></div>
              <div className="text-xs text-gray-500">{c.messageCount} messages · {c.status}</div>
            </button>
          ))}
          {rows.length === 0 && <div className="text-sm text-gray-500">No conversations yet.</div>}
        </div>
        <div className="rounded border bg-white p-3">
          {!open && <div className="text-sm text-gray-500">Select a thread.</div>}
          {open && (
            <div className="flex flex-col gap-2">
              {msgs.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded p-2 text-sm ${m.direction === "inbound" ? "bg-gray-100 self-start" : "bg-blue-100 self-end"}`}>
                  {m.body}
                  <div className="text-[10px] text-gray-500">{m.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
