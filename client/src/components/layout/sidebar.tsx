"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Utensils,
  ReceiptText,
  BarChart3,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useOrderStore } from "@/store/order.store";
import { useOrders } from "@/lib/hooks/order.hooks";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
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
];

const Sidebar = () => {
  const pathname = usePathname();
  const { receipts } = useOrderStore();
  const ordersQuery = useOrders();
  const unpaidCount =
    receipts.filter((r) => r.status === "UNPAID").length +
    (ordersQuery.data?.unpaidCount ?? 0);

  return (
    <ShadcnSidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="flex h-20 items-center justify-center px-4 group-data-[collapsible=icon]:px-0">
        <Link
          href="/catalog"
          className="flex items-center gap-3 group-data-[collapsible=icon]:gap-0"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:rounded-xl">
            <Utensils
              size={20}
              strokeWidth={2.5}
              className="group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5"
            />
          </div>
          <div className="flex flex-col overflow-hidden whitespace-nowrap group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              Cafe POS
            </span>
            <span className="text-[10px] text-sidebar-foreground/60">
              Counter Workspace
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <div className="h-px w-full bg-sidebar-border hidden group-data-[collapsible=icon]:block" />

      <SidebarContent className="py-4">
        <SidebarMenu className="px-2">
          {primaryNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "h-12 rounded-xl transition-[width,height,margin,padding,color,background-color] duration-200 ease-in-out data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90",
                    "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!justify-center",
                    !isActive &&
                      "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon size={20} className="shrink-0" />
                    <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                      {item.label}
                    </span>
                  </Link>
                </SidebarMenuButton>

                {item.label === "Orders" && unpaidCount > 0 && (
                  <SidebarMenuBadge className="bg-primary text-primary-foreground group-data-[collapsible=icon]:hidden">
                    {unpaidCount}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-0">
        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith("/settings")}
              tooltip="Settings"
              className={cn(
                "h-12 rounded-xl transition-[width,height,margin,padding,color,background-color] duration-200 ease-in-out data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary/90",
                "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!justify-center",
                !pathname.startsWith("/settings") &&
                  "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Link href="/settings" className="flex items-center gap-3">
                <Settings size={20} className="shrink-0" />
                <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                  Settings
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="my-2 h-px w-full bg-sidebar-border group-data-[collapsible=icon]:hidden" />

        <SidebarMenu className="px-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent transition-[width,height,margin,padding,color,background-color] duration-200 ease-in-out",
                "group-data-[collapsible=icon]:!size-12 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:!mx-auto group-data-[collapsible=icon]:!justify-center",
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground ring-2 ring-sidebar-border">
                JS
              </div>
              <div className="flex flex-1 flex-col items-start overflow-hidden text-left group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-bold text-sidebar-foreground">
                  Cashier
                </span>
                <span className="text-[10px] text-sidebar-foreground/60">
                  Shift Active
                </span>
              </div>
              <ChevronDown
                size={14}
                className="ml-auto text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
};

export default Sidebar;
