"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Utensils,
  ShoppingCart,
  ReceiptText,
  BarChart3,
  Settings,
} from "lucide-react";

const nav = [
  { href: "/catalog", label: "New Receipt", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="m-3 flex w-64 shrink-0 flex-col rounded-2xl bg-sidebar p-4 text-sidebar-foreground shadow-xl">
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-3 px-2 pt-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Utensils size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">Cafe POS</h1>
          <p className="text-xs text-sidebar-foreground/60">
            Counter Workspace
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon
                size={18}
                className={active ? "opacity-100" : "opacity-70"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Footer Area */}
      <div className="mt-auto border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-3 rounded-xl px-2 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground ring-2 ring-sidebar-border">
            JS
          </div>
          <div className="text-xs">
            <p className="font-semibold">Cashier</p>
            <p className="text-sidebar-foreground/60">Shift Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
