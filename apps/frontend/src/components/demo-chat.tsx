"use client";

import { useState } from "react";
import { apiFetch, API_BASE } from "@/lib/api";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function DemoChat({ starter }: { starter: string }) {
  const [text, setText] = useState(starter);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const id = uuid();
    try {
      setLog((l) => [...l, `you: ${body}`]);
      const created: any = await apiFetch("/webhooks/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          id, timestamp: new Date().toISOString(),
          from: "+213555000001", to: "demo", text: body, status: "delivered",
        }),
      });
      const result: any = await apiFetch(`/api/orders/webhooks/${created.webhookEventId}/process`, { method: "POST" });
      setLog((l) => [...l, `system: ${JSON.stringify(result).slice(0, 300)}`]);
      setText("");
    } catch (e: any) {
      setLog((l) => [...l, `error: ${e.message} (backend: ${API_BASE})`]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border bg-white p-3">
      <div className="mb-2 flex max-h-64 flex-col gap-1 overflow-y-auto text-sm">
        {log.map((l, i) => (
          <div key={i} className={l.startsWith("you:") ? "self-end bg-blue-100 rounded p-2" : "self-start bg-gray-100 rounded p-2"}>{l}</div>
        ))}
        {log.length === 0 && <div className="text-gray-500">Type a message, e.g. “I want 2x Product A”.</div>}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded border px-2 py-1 text-sm" placeholder="Message as customer…" />
        <button onClick={send} disabled={busy} className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50">
          {busy ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
