"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Utensils,
  ReceiptText,
  BarChart3,
  Calculator,
  Settings,
  Package,
} from "lucide-react";
import { useOrderStore } from "@/store/order.store";
import { useOrders } from "@/lib/hooks/order.hooks";
import { useCurrentStaff } from "@/lib/hooks/auth.hooks";
import { useCurrentSession } from "@/lib/hooks/session.hooks";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/catalog", label: "New Receipt", icon: Utensils },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/expenses", label: "Expenses", icon: Calculator },
];

const manageNav = [
  { href: "/products", label: "Menu", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
];

const Sidebar = () => {
  const pathname = usePathname();
  const { receipts } = useOrderStore();
  const { data: staff } = useCurrentStaff();
  const currentSessionQuery = useCurrentSession();
  const ordersQuery = useOrders();
  const unpaidCount =
    receipts.filter((r) => r.status === "UNPAID").length +
    (ordersQuery.data?.unpaidCount ?? 0);
  const staffInitials =
    staff?.name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "--";
  const roleLabel = staff?.role
    ? `${staff.role[0]}${staff.role.slice(1).toLowerCase()}`
    : "Staff";
  const sessionLabel = currentSessionQuery.isLoading
    ? "Checking register"
    : currentSessionQuery.isError
      ? "Session unavailable"
      : currentSessionQuery.data
        ? "Register open"
        : "No open session";
  const sessionIsOpen =
    !currentSessionQuery.isError && Boolean(currentSessionQuery.data);

  return (
    <ShadcnSidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="flex h-[4.75rem] items-center justify-center border-b border-sidebar-border px-4 group-data-[collapsible=icon]:px-0">
        <Link
          aria-label="Cafe POS home"
          href="/catalog"
          className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0"
        >
          <Image
            src="/icon.svg"
            alt=""
            width={40}
            height={40}
            unoptimized
            className="size-10 shrink-0 rounded-xl shadow-sm"
          />
          <div className="flex min-w-0 flex-col overflow-hidden whitespace-nowrap group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              Cafe POS
            </span>
            <span className="truncate text-[10px] text-sidebar-foreground/60">
              Counter Workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45 group-data-[collapsible=icon]:sr-only">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-2">
              {primaryNav.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-11 rounded-xl transition-colors duration-150 data-[active=true]:bg-primary data-[active=true]:font-semibold data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm data-[active=true]:hover:bg-primary/90",
                        "group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!size-11 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0",
                        !isActive &&
                          "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex min-w-0 items-center gap-3"
                      >
                        <item.icon size={19} className="shrink-0" />
                        <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>

                    {item.label === "Orders" && unpaidCount > 0 && (
                      <SidebarMenuBadge className="bg-primary/15 font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                        {unpaidCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 border-t border-sidebar-border px-2 py-3">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45 group-data-[collapsible=icon]:sr-only">
            Manage
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageNav.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-11 rounded-xl transition-colors duration-150 data-[active=true]:bg-primary data-[active=true]:font-semibold data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm data-[active=true]:hover:bg-primary/90",
                        "group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!size-11 group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0",
                        !isActive &&
                          "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3"
                      >
                        <item.icon size={19} className="shrink-0" />
                        <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div
          className="flex min-w-0 items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:px-0"
          title={`${staff?.name ?? "Staff"} · ${sessionLabel}`}
        >
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground ring-1 ring-sidebar-border">
            {staffInitials}
            <span
              aria-hidden="true"
              className={cn(
                "absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-sidebar",
                sessionIsOpen ? "bg-emerald-500" : "bg-muted-foreground",
              )}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold leading-5 text-sidebar-foreground">
              {staff?.name ?? "Signed-in staff"}
            </span>
            <span className="flex min-w-0 items-center gap-2 text-[10px]">
              <span className="shrink-0 text-sidebar-foreground/60">
                {roleLabel}
              </span>
              <span
                className={cn(
                  "flex min-w-0 items-center gap-1 truncate",
                  sessionIsOpen
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-sidebar-foreground/60",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    sessionIsOpen
                      ? "bg-emerald-500"
                      : currentSessionQuery.isError
                        ? "bg-destructive"
                        : "bg-muted-foreground/60",
                  )}
                />
                {sessionLabel}
              </span>
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
};

export default Sidebar;
