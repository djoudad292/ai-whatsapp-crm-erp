"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function OrdersPage() {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/api/orders").then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Orders</h1>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-gray-500">
              <th className="p-2">Number</th><th className="p-2">Customer</th>
              <th className="p-2">Total</th><th className="p-2">Status</th><th className="p-2">Odoo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="p-2 font-mono text-xs">{o.orderNumber}</td>
                <td className="p-2">{o.customer?.name ?? "—"} <span className="text-xs text-gray-500">{o.customer?.phone}</span></td>
                <td className="p-2">{o.total}</td>
                <td className="p-2">{o.status}</td>
                <td className="p-2">{o.odooId ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div className="p-4 text-sm text-gray-500">No orders yet.</div>}
      </div>
    </div>
  );
}
