"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Users, Package,
  CheckSquare, ScrollText, Activity, LogOut, Bot, Menu, X,
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/login");
    else {
      try {
        setUser(JSON.parse(localStorage.getItem("user") ?? "null"));
      } catch { /* ignore */ }
      setReady(true);
    }
  }, [router]);

  useEffect(() => setOpen(false), [pathname]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-fg-muted">Checking session…</div>;
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-4 pb-4 pt-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6063ee] to-[#7d55f3] shadow-glow">
          <Bot size={17} className="text-white" />
        </span>
        <span className="truncate text-[13px] font-bold tracking-tight">
          WhatsApp CRM
          <span className="block text-[10px] font-normal text-fg-muted">AI · CRM · ERP</span>
        </span>
      </Link>
      <nav className="flex flex-col gap-0.5 px-2.5">
        {NAV.map((n) => {
          const active = pathname === n.href;
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-primary-soft font-semibold text-fg shadow-card"
                  : "text-fg-secondary hover:bg-surface-hover hover:text-fg"
              }`}
            >
              <Icon size={15} className="shrink-0" /> <span className="truncate">{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border p-3.5">
        <div className="mb-2 truncate text-[11px] text-fg-muted">
          {user?.sub ?? "operator"} · {user?.role ?? ""}
        </div>
        <button
          onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); }}
          className="flex items-center gap-2 text-xs text-fg-secondary hover:text-danger"
        >
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      {/* Desktop sidebar: thinner (w-48) */}
      <aside className="hidden w-48 shrink-0 border-r border-border bg-surface lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-52 transform border-r border-border bg-surface transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-2 top-4 rounded p-1 text-fg-muted hover:text-fg">
          <X size={18} />
        </button>
        {sidebar}
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-surface px-3 py-2.5 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded p-1.5 text-fg-secondary hover:bg-surface-hover hover:text-fg">
            <Menu size={20} />
          </button>
          <span className="truncate text-sm font-bold">WhatsApp CRM</span>
        </header>
        <main className="p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
