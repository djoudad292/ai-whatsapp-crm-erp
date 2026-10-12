import Link from "next/link";

export default function Home() {
  return (
    <div className="pub min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--pub-line)] bg-[var(--pub-bg)]/95 backdrop-blur">
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
              href="/try"
              className="px-2 py-2 text-[13px] text-[var(--pub-ink-2)] hover:text-[var(--pub-ink)]"
            >
              Try it
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-[var(--pub-line-strong)] px-3 py-2 text-[13px] font-medium text-[var(--pub-ink)] hover:bg-[var(--pub-panel)]"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--pub-accent)]">
              WhatsApp · CRM · ERP
            </p>
            <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-tight text-[var(--pub-ink)] sm:text-[52px]">
              Turn WhatsApp messages into orders,
              <br className="hidden sm:block" />
              customers and ERP records.
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[var(--pub-ink-2)]">
              An AI agent reads every inbound message, checks inventory, creates
              CRM orders, captures leads and hands the conversation to a human
              when it needs judgement. One dashboard for conversations, orders,
              approvals and audit.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/try"
                className="inline-flex items-center justify-center rounded-md bg-[var(--pub-ink)] px-5 py-3 text-[15px] font-medium text-[var(--pub-panel)] hover:bg-[#2e2c28]"
              >
                Try the demo — no signup
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-[var(--pub-line-strong)] px-5 py-3 text-[15px] font-medium text-[var(--pub-ink)] hover:bg-[var(--pub-panel)]"
              >
                Open the dashboard
              </Link>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[var(--pub-ink-3)]">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pub-accent)]" />
                Inbound WhatsApp webhooks
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pub-accent)]" />
                AI order + inquiry workflow
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pub-accent)]" />
                Human approvals &amp; audit log
              </li>
            </ul>
          </div>
        </section>

        <section className="border-y border-[var(--pub-line)] bg-[var(--pub-panel)]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-px px-4 sm:px-6 sm:grid-cols-3">
            {[
              {
                title: "Conversations",
                body: "Every WhatsApp thread, its messages and the customer behind it, in one place.",
              },
              {
                title: "Orders",
                body: "Orders created from chat, with stock checks, totals and Odoo sync status.",
              },
              {
                title: "Approvals",
                body: "High-value or risky actions wait for a human sign-off before anything ships.",
              },
            ].map((f) => (
              <div key={f.title} className="px-6 py-8">
                <h3 className="text-[15px] font-semibold text-[var(--pub-ink)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--pub-ink-2)]">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>
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