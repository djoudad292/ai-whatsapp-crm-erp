"use client";

import { useEffect, useRef, useState } from "react";

type MessageStatus = "queued" | "delivered" | "failed";

interface OutboundMessage {
  id: string;
  text: string;
  status: MessageStatus;
  timestamp: string;
  from: string;
  to: string;
}

const DEFAULT_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_BACKEND_WEBHOOK_URL ?? "http://localhost:3000/webhooks/whatsapp";

const CUSTOMER_PHONE = "+15551234567";
const GATEWAY_PHONE = "+15550000000";

function makeId() {
  return `wa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function statusColor(status: MessageStatus) {
  switch (status) {
    case "delivered":
      return "text-green-600";
    case "failed":
      return "text-red-600";
    case "queued":
    default:
      return "text-amber-600";
  }
}

export function Chat() {
  const [messages, setMessages] = useState<OutboundMessage[]>([]);
  const [text, setText] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;

    const status: MessageStatus = simulateFailure ? "failed" : "delivered";
    const msg: OutboundMessage = {
      id: makeId(),
      text: body,
      status,
      timestamp: new Date().toISOString(),
      from: GATEWAY_PHONE,
      to: CUSTOMER_PHONE,
    };

    setSending(true);
    setLastResponse(null);
    setMessages((prev) => [...prev, msg]);
    setText("");

    try {
      const res = await fetch(DEFAULT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msg),
      });

      const json = await res.json().catch(() => ({}));
      setLastResponse(
        `HTTP ${res.status} — ${JSON.stringify(json)}`,
      );
    } catch (err: any) {
      setLastResponse(`request failed: ${err?.message ?? "unknown error"}`);
      // Mark the message as failed locally since the webhook was unreachable.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, status: "failed" } : m,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(e) => setSimulateFailure(e.target.checked)}
            className="h-4 w-4"
          />
          Simulate delivery failure
        </label>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">
          Webhook: <code className="text-xs">{DEFAULT_WEBHOOK_URL}</code>
        </span>
      </div>

      <div className="flex h-[60vh] flex-col rounded-lg border bg-white">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-gray-400">
              No messages yet. Type a customer message below.
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="mb-2 flex flex-col">
                <div className="max-w-[80%] rounded-lg bg-blue-600 px-3 py-2 text-white">
                  <p className="whitespace-pre-wrap text-sm">{m.text}</p>
                  <span className="mt-1 block text-[10px] text-blue-100">
                    {new Date(m.timestamp).toLocaleTimeString()} · to {m.to}
                  </span>
                </div>
                <span
                  className={`ml-1 mt-1 text-[11px] font-medium ${statusColor(
                    m.status,
                  )}`}
                >
                  status: {m.status}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-3">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type a customer message…"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Send
            </button>
          </div>
          {lastResponse && (
            <pre className="mt-2 max-h-24 overflow-auto rounded bg-gray-100 p-2 text-[11px] text-gray-700">
              {lastResponse}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}