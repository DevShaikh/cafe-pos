"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useCurrentStaff } from "@/lib/hooks/auth.hooks";

const AuthGate = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { isPending, isError } = useCurrentStaff();

  useEffect(() => {
    if (isError) router.replace("/login");
  }, [isError, router]);

  if (isPending || isError) {
    return (
      <div className="flex h-full min-h-64 items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-primary" />
        <span className="sr-only">Checking session</span>
      </div>
    );
  }

  return children;
};

export default AuthGate;
