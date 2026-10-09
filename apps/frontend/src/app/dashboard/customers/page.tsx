"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function CustomersPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { apiFetch("/api/customers").then(setRows).catch(() => setRows([])); }, []);
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Customers</h1>
      <div className="grid gap-2 md:grid-cols-3">
        {rows.map((c) => (
          <div key={c.id} className="rounded border bg-white p-3 text-sm">
            <div className="font-medium">{c.name}</div>
            <div className="text-xs text-gray-500">{c.phone} · {c.email ?? "no email"} · {c.type}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-gray-500">No customers yet.</div>}
      </div>
    </div>
  );
}
