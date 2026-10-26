"use client";

import { usePathname } from "next/navigation";
import ModeToggle from "@/components/ui/mode-toggle"; // Adjust path if needed
import { CircleDot } from "lucide-react";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/services/auth.service";
import { authKeys, useCurrentStaff } from "@/lib/hooks/auth.hooks";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: staff } = useCurrentStaff();
  const [time, setTime] = useState<string>("");
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: authKeys.session });
      router.replace("/login");
    },
  });

  const initials = staff?.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Live clock for the cashier
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamically set the page title based on route
  const getPageTitle = () => {
    if (pathname.startsWith("/catalog")) return "New Receipt";
    if (pathname.startsWith("/orders")) return "Orders & Payments";
    if (pathname.startsWith("/reports")) return "Sales Reports";
    if (pathname.startsWith("/settings")) return "Settings";
    return "Cafe POS";
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      {/* Left side: Page Context */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <div className="h-4 w-px bg-border" />
        <h1 className="text-lg font-bold tracking-tight text-foreground"></h1>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          {getPageTitle()}
        </h1>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
          <CircleDot size={10} className="animate-pulse" />
          Live
        </div>
      </div>

      {/* Right side: Utilities */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span>{time || "--:--"}</span>
          <span className="text-border">|</span>
          <span className="font-bold">PKR</span>
        </div>

        <div className="h-6 w-px bg-border" />

        <ModeToggle />

        <div className="flex items-center gap-2.5">
          <div className="flex-col items-end hidden sm:flex">
            <span className="text-xs font-bold text-foreground">
              {staff?.name ?? "Cashier"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Register 01
            </span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
            {initials || "--"}
          </div>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
