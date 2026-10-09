"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Users, Package,
  CheckSquare, ScrollText, Activity, LogOut, Bot,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/dashboard/audit", label: "Audit Log", icon: ScrollText },
  { href: "/dashboard/health", label: "Health", icon: Activity },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/login");
    else {
      try {
        setUser(JSON.parse(localStorage.getItem("user") ?? "null"));
      } catch { /* ignore */ }
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-fg-muted">Checking session…</div>;
  }

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <Link href="/" className="flex items-center gap-2 px-5 pb-4 pt-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#6063ee] to-[#7d55f3] shadow-glow">
            <Bot size={18} className="text-white" />
          </span>
          <span className="text-sm font-bold tracking-tight">
            WhatsApp CRM
            <span className="block text-[10px] font-normal text-fg-muted">AI · CRM · ERP</span>
          </span>
        </Link>
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors ${
                  active
                    ? "bg-primary-soft font-semibold text-fg shadow-card"
                    : "text-fg-secondary hover:bg-surface-hover hover:text-fg"
                }`}
              >
                <Icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-border p-4">
          <div className="mb-2 truncate text-xs text-fg-muted">
            {user?.sub ?? "operator"} · {user?.role ?? ""}
          </div>
          <button
            onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); }}
            className="flex items-center gap-2 text-xs text-fg-secondary hover:text-danger"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-6">{children}</main>
    </div>
  );
}
