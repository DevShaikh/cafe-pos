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
import {
  useCloseSession,
  useCurrentSession,
  useOpenSession,
} from "@/lib/hooks/session.hooks";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: staff } = useCurrentStaff();
  const currentSessionQuery = useCurrentSession();
  const openSessionMutation = useOpenSession();
  const closeSessionMutation = useCloseSession();
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
  const sessionError = openSessionMutation.isError || closeSessionMutation.isError;
  const sessionPending = openSessionMutation.isPending || closeSessionMutation.isPending;

  const toggleSession = () => {
    if (currentSessionQuery.data) {
      closeSessionMutation.mutate({
        sessionId: currentSessionQuery.data.id,
        idempotencyKey: crypto.randomUUID(),
      });
      return;
    }
    openSessionMutation.mutate(crypto.randomUUID());
  };

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
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <CircleDot
            size={10}
            className={currentSessionQuery.data ? "animate-pulse text-green-600 dark:text-green-400" : "text-muted-foreground"}
          />
          {currentSessionQuery.data ? "Session open" : "No open session"}
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

        <button
          type="button"
          onClick={toggleSession}
          disabled={sessionPending || currentSessionQuery.isLoading}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
        >
          {sessionPending
            ? "Saving…"
            : currentSessionQuery.data
              ? "Close session"
              : "Open session"}
        </button>

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
      {sessionError && (
        <p className="absolute right-6 top-14 z-10 rounded-md bg-destructive px-3 py-2 text-xs text-destructive-foreground">
          {currentSessionQuery.data
            ? "This session has unpaid orders that need attention before closing."
            : "Session could not be opened. Please try again."}
        </p>
      )}
    </header>
  );
};

export default Navbar;
