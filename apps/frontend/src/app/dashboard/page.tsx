"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Metrics {
  messagesReceived: number;
  messagesSent: number;
  ordersCreated: number;
  ordersFailed: number;
  refundsRequested: number;
  retries: number;
}

const ARCHITECTURE = `
+------------------+     +------------------+     +------------------+
|   WhatsApp       |     |   Backend        |     |   Odoo ERP       |
|   Gateway        |---->|   (NestJS)       |---->|   (Orders,       |
|   (Mock)         |     |   /api/metrics   |     |   Inventory,     |
+------------------+     |   /webhooks      |     |   Customers)     |
                         |   /api/orders    |     +------------------+
                         |   /health        |
                         +------------------+
                                |
                                v
                         +------------------+
                         |   Frontend       |
                         |   (Next.js)      |
                         |   /dashboard     |
                         |   /orders        |
                         |   /approvals     |
                         |   /audit         |
                         |   /health        |
                         +------------------+
`;

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    messagesReceived: 0,
    messagesSent: 0,
    ordersCreated: 0,
    ordersFailed: 0,
    refundsRequested: 0,
    retries: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/metrics");
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch {
        // ignore
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { label: "Messages Received", value: metrics.messagesReceived },
    { label: "Messages Sent", value: metrics.messagesSent },
    { label: "Orders Created", value: metrics.ordersCreated },
    { label: "Orders Failed", value: metrics.ordersFailed },
    { label: "Refunds Requested", value: metrics.refundsRequested },
    { label: "Retries", value: metrics.retries },
  ];

  const navLinks = [
    { href: "/conversations", label: "Conversations" },
    { href: "/orders", label: "Orders" },
    { href: "/approvals", label: "Approvals" },
    { href: "/audit", label: "Audit Log" },
    { href: "/health", label: "Health" },
  ];

  return (
    <main className="min-h-screen p-8 font-mono text-sm bg-gray-50">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">AI WhatsApp CRM/ERP — Metrics & Navigation</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded p-4"
          >
            <div className="text-gray-500">{stat.label}</div>
            <div className="text-3xl font-bold mt-1">{stat.value}</div>
          </div>
        ))}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-2">Architecture</h2>
        <pre className="bg-gray-900 text-green-300 p-4 rounded overflow-x-auto text-xs">
          {ARCHITECTURE}
        </pre>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-2">Navigation</h2>
        <nav className="flex flex-wrap gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white border border-gray-200 rounded px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}