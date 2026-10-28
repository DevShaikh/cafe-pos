"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LoaderCircle, LogIn } from "lucide-react";
import { authKeys, useCurrentStaff } from "@/lib/hooks/auth.hooks";
import {
  getActiveStaff,
  login,
} from "@/lib/services/auth.service";

const LoginPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useCurrentStaff();
  const [staffId, setStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const staffQuery = useQuery({
    queryKey: ["auth", "staff"],
    queryFn: async ({ signal }) => {
      const response = await getActiveStaff(signal);
      return response.data.data;
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async () => {
      setErrorMessage("");
      await queryClient.invalidateQueries({ queryKey: authKeys.session });
      router.replace("/catalog");
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        setErrorMessage(
          error.response?.data?.error?.message ?? "Unable to sign in.",
        );
        return;
      }
      setErrorMessage("Unable to sign in. Please try again.");
    },
  });

  useEffect(() => {
    if (session.data) router.replace("/catalog");
  }, [router, session.data]);

  useEffect(() => {
    if (session.data) router.replace("/catalog");
  }, [router, session.data]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    loginMutation.mutate({ staffId, pin });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Cafe POS</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your staff PIN to open the register.
          </p>
        </div>

        {staffQuery.isLoading ? (
          <div className="flex justify-center py-8" role="status">
            <LoaderCircle className="size-6 animate-spin text-primary" />
          </div>
        ) : staffQuery.isError ? (
          <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            Could not load staff. Check that the API is running.
          </p>
        ) : staffQuery.data?.length === 0 ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            No active staff accounts are set up yet.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm font-medium">
              <span>Staff member</span>
              <select
                required
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {staffQuery.data?.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>PIN</span>
              <input
                required
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>

            {errorMessage && (
              <p className="text-sm text-destructive" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={!staffId || !pin || loginMutation.isPending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loginMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              Sign in
            </button>
          </form>
        )}
      </section>
    </main>
  );
};

export default LoginPage;
