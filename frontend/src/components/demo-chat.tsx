"use client";

import { useState } from "react";
import { apiFetch, API_BASE } from "@/lib/api";
import { SendHorizontal } from "lucide-react";

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

interface Bubble {
  id: string;
  role: "user" | "assistant" | "error";
  text: string;
}

export function DemoChat({ starter }: { starter: string }) {
  const [text, setText] = useState(starter);
  const [log, setLog] = useState<Bubble[]>([
    { id: "welcome", role: "assistant", text: "Hi! I'm the shop assistant. Ask about stock or order something — try “I want 2x Product A”." },
  ]);
  const [busy, setBusy] = useState(false);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    const id = uuid();
    setLog((l) => [...l, { id: `${id}-u`, role: "user", text: body }]);
    setText("");
    try {
      const created: any = await apiFetch("/webhooks/whatsapp", {
        method: "POST",
        body: JSON.stringify({
          id, timestamp: new Date().toISOString(),
          from: "+213555000001", to: "demo", text: body, status: "delivered",
        }),
      });
      await apiFetch(`/api/orders/webhooks/${created.webhookEventId}/process`, { method: "POST" });
      // Read back the assistant's actual reply from the thread.
      const msgs: any[] = await apiFetch(`/api/conversations/${created.conversationId}/messages`);
      const replies = msgs.filter((m) => m.direction === "outbound").map((m) => m.body);
      const reply = replies[replies.length - 1] ?? "Done — but I couldn't find a reply in the thread.";
      setLog((l) => [...l, { id: `${id}-a`, role: "assistant", text: reply }]);
    } catch (e: any) {
      setLog((l) => [...l, { id: `${id}-e`, role: "error", text: `Something went wrong: ${e.message} (backend: ${API_BASE})` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface shadow-card">
      <div className="flex max-h-[28rem] min-h-[16rem] flex-col gap-2 overflow-y-auto p-4">
        {log.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "self-end bg-primary text-white shadow-glow"
                : m.role === "error"
                  ? "self-start border border-danger/40 bg-danger/10 text-fg"
                  : "self-start bg-surface-alt text-fg shadow-card"
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && <div className="self-start animate-pulse rounded-2xl bg-surface-alt px-3 py-2 text-sm text-fg-muted">…</div>}
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-muted focus:border-primary"
          placeholder="Message as customer…"
        />
        <button
          onClick={send}
          disabled={busy}
          aria-label="Send message"
          className="flex items-center rounded-xl bg-primary px-3 py-2 text-primary-fg shadow-glow disabled:opacity-50"
        >
          <SendHorizontal size={16} />
        </button>
      </div>
    </div>
  );
}
