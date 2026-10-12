"use client";

import { useState } from "react";
import Link from "next/link";
import { DemoChat } from "@/components/demo-chat";

const tryThese = [
  "I want 2x Product A",
  "What is the stock for Product B?",
  "I need a refund for order #1234",
];

export default function TryPage() {
  const [starter, setStarter] = useState("");
  return (
    <div className="pub min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--pub-line)] bg-[var(--pub-bg)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[15px] font-semibold tracking-tight text-[var(--pub-ink)]">
              WhatsApp CRM
            </span>
            <span className="hidden text-[11px] text-[var(--pub-ink-3)] sm:inline">
              AI · CRM · ERP
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="/"
              className="px-2 py-2 text-[13px] text-[var(--pub-ink-2)] hover:text-[var(--pub-ink)]"
            >
              Home
            </Link>
            <Link
              href="/try"
              aria-current="page"
              className="rounded-md bg-[var(--pub-ink)] px-3 py-2 text-[13px] font-medium text-[var(--pub-panel)]"
            >
              Try it
            </Link>
            <Link
              href="/login"
              className="rounded-md px-2 py-2 text-[13px] text-[var(--pub-ink-2)] hover:text-[var(--pub-ink)]"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,44rem)] lg:gap-14">
          <div className="lg:pr-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--pub-accent)]">
              Live demo · no account needed
            </p>
            <h1 className="mt-3 text-[28px] font-semibold leading-[1.15] tracking-tight text-[var(--pub-ink)] sm:text-[40px]">
              Talk to the agent. No signup, no card.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--pub-ink-2)]">
              This is the real chat. It answers from a knowledge base, opens
              tickets, checks orders, captures leads and hands the conversation
              to a person when it needs judgement. Type a question below — the
              demo runs in a shared guest workspace with a fresh thread each
              visit.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <Link
                href="#chat"
                className="inline-flex items-center justify-center rounded-md bg-[var(--pub-ink)] px-4 py-2.5 text-[14px] font-medium text-[var(--pub-panel)] hover:bg-[#2e2c28]"
              >
                Try it now — no signup
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md border border-[var(--pub-line-strong)] px-4 py-2.5 text-[14px] font-medium text-[var(--pub-ink)] hover:bg-[var(--pub-panel)]"
              >
                Back to the overview
              </Link>
            </div>

            <p className="mt-4 max-w-lg text-[12px] leading-relaxed text-[var(--pub-ink-3)]">
              Suggested prompts to start with:
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {tryThese.map((t) => (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => {
                      setStarter(t);
                      document
                        .getElementById("chat")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-block cursor-pointer rounded-md border border-[var(--pub-line-strong)] bg-[var(--pub-panel)] px-3 py-1.5 text-[13px] text-[var(--pub-ink-2)] hover:text-[var(--pub-ink)]"
                  >
                    {t}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div id="chat" className="scroll-mt-20 lg:pt-4">
            <DemoChat starter={starter} />
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--pub-ink-3)]">
              Worth trying:{" "}
              {tryThese.map((t, i) => (
                <span key={t}>
                  {i > 0 && " · "}
                  <span className="text-[var(--pub-ink-2)]">&ldquo;{t}&rdquo;</span>
                </span>
              ))}
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--pub-line)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-[11px] leading-5 text-[var(--pub-ink-3)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>WhatsApp CRM · Next.js, NestJS, Postgres</span>
          <span>
            Built by{" "}
            <a
              href="https://djaouad.is-a.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--pub-ink-2)] underline decoration-[var(--pub-line-strong)] underline-offset-2 hover:text-[var(--pub-ink)]"
            >
              Djaouad Frih
            </a>{" "}
            · djaouad.is-a.dev
          </span>
        </div>
      </footer>
    </div>
  );
}