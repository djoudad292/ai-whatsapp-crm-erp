"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function ProductsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { apiFetch("/api/products").then(setRows).catch(() => setRows([])); }, []);
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold">Products</h1>
      <div className="grid gap-2 md:grid-cols-3">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border border-b border-borderorder bg-surface p-3 text-sm">
            <div className="font-medium">{p.name} <span className="text-xs text-fg-muted">({p.sku})</span></div>
            <div className="text-xs">price {p.price} · stock {p.stockQuantity} · {p.isActive ? "active" : "inactive"}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-fg-muted">No products yet.</div>}
      </div>
    </div>
  );
}
