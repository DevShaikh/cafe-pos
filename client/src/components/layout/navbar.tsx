"use client";

import { usePathname } from "next/navigation";
import ModeToggle from "@/components/ui/mode-toggle"; // Adjust path if needed
import { CircleDot } from "lucide-react";
import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Navbar = () => {
  const pathname = usePathname();
  const [time, setTime] = useState<string>("");

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
    if (pathname.startsWith("/reports")) return "Session Reports";
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

        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="flex-col items-end hidden sm:flex">
            <span className="text-xs font-bold text-foreground">Cashier</span>
            <span className="text-[10px] text-muted-foreground">
              Register 01
            </span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
            JS
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
