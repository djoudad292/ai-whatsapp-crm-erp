"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, MessageSquare, ShoppingCart, Users, Package,
  CheckSquare, ScrollText, Activity,
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

  useEffect(() => {
    if (!localStorage.getItem("token")) router.push("/login");
    else setReady(true);
  }, [router]);

  if (!ready) return <div className="p-8 text-sm text-gray-500">Checking session…</div>;

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="w-56 shrink-0 border-r bg-white p-4">
        <Link href="/" className="mb-6 block text-sm font-bold">AI WhatsApp · CRM · ERP</Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${active ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}
              >
                <Icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>
        <button
          className="mt-6 text-xs text-gray-500 underline"
          onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); router.push("/login"); }}
        >
          Log out
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
