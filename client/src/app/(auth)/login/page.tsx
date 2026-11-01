"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import { Coffee, LoaderCircle, LogIn } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { authKeys, useCurrentStaff } from "@/lib/hooks/auth.hooks";
import { getActiveStaff, login } from "@/lib/services/auth.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const loginFormSchema = z.object({
  staffId: z.uuid("Select an active staff member."),
  pin: z.string().regex(/^\d{4}$/, "Enter your 4-digit PIN."),
});

const LoginPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useCurrentStaff();
  const [preferredStaffId, setPreferredStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    staffId?: string;
    pin?: string;
  }>({});
  const [errorMessage, setErrorMessage] = useState("");

  const staffQuery = useQuery({
    queryKey: ["auth", "staff"],
    queryFn: async ({ signal }) => {
      const response = await getActiveStaff(signal);
      return response.data.data;
    },
  });

  const staffId =
    staffQuery.data?.find(({ id }) => id === preferredStaffId)?.id ??
    staffQuery.data?.[0]?.id ??
    "";
  const canSubmit = Boolean(staffId) && /^\d{4}$/.test(pin);

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = loginFormSchema.safeParse({ staffId, pin });
    if (!parsed.success) {
      const nextErrors: typeof fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "staffId" || field === "pin") {
          nextErrors[field] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      setErrorMessage("");
      return;
    }

    setFieldErrors({});
    setErrorMessage("");
    loginMutation.mutate(parsed.data);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--color-primary),transparent_68%)] opacity-20"
      />
      <Card className="relative w-full max-w-md gap-0 rounded-3xl border-border/80 p-7 shadow-xl shadow-foreground/5 sm:p-9">
        <CardContent className="p-0">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Coffee className="size-6" aria-hidden="true" />
            </div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Cafe POS
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome back
            </h1>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
              Choose your staff account and enter your PIN to open the register.
            </p>
          </div>

          {staffQuery.isLoading ? (
            <div className="flex justify-center py-8" role="status">
              <LoaderCircle className="size-6 animate-spin text-primary" />
            </div>
          ) : staffQuery.isError ? (
            <p
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              Could not load staff. Check that the API is running.
            </p>
          ) : staffQuery.data?.length === 0 ? (
            <div className="space-y-3">
              <Badge variant="secondary">No active staff</Badge>
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                No active staff accounts are set up yet.
              </p>
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={handleSubmit}
              aria-busy={loginMutation.isPending}
              noValidate
            >
              <FieldGroup>
                <Field data-invalid={Boolean(fieldErrors.staffId)}>
                  <FieldLabel
                    htmlFor="staffId"
                    className="text-sm font-semibold"
                  >
                    Staff member
                  </FieldLabel>
                  <Select
                    value={staffId}
                    disabled={loginMutation.isPending}
                    onValueChange={(value) => {
                      setPreferredStaffId(value);
                      setPin("");
                      setErrorMessage("");
                      setFieldErrors((current) => ({
                        ...current,
                        staffId: undefined,
                      }));
                    }}
                  >
                    <SelectTrigger
                      id="staffId"
                      className="h-12 w-full rounded-xl"
                      aria-invalid={Boolean(fieldErrors.staffId)}
                      aria-describedby={
                        fieldErrors.staffId ? "staffId-error" : undefined
                      }
                    >
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffQuery.data?.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="staffId-error">
                    {fieldErrors.staffId}
                  </FieldError>
                </Field>

                <Field data-invalid={Boolean(fieldErrors.pin)}>
                  <FieldLabel
                    htmlFor="pin"
                    className="text-sm font-semibold"
                  >
                    4-digit PIN
                  </FieldLabel>
                  <InputOTP
                    id="pin"
                    maxLength={4}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={pin}
                    disabled={loginMutation.isPending}
                    containerClassName="w-full justify-center"
                    onChange={(value) => {
                      setPin(value);
                      setErrorMessage("");
                      setFieldErrors((current) => ({
                        ...current,
                        pin: undefined,
                      }));
                    }}
                    aria-label="4-digit PIN"
                    aria-invalid={Boolean(fieldErrors.pin)}
                    aria-describedby={
                      fieldErrors.pin ? "pin-error" : "pin-description"
                    }
                  >
                    <InputOTPGroup
                      aria-hidden="true"
                      className="gap-3 rounded-none"
                    >
                      {Array.from({ length: 4 }, (_, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          mask
                          className="size-14 rounded-xl border first:border-l bg-background text-xl font-semibold shadow-xs data-[active=true]:border-ring data-[active=true]:bg-primary/5"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                  {!fieldErrors.pin && (
                    <FieldDescription
                      id="pin-description"
                      className="text-center"
                    >
                      {canSubmit
                        ? "PIN entered. Sign in when ready."
                        : "Enter all 4 digits to enable sign in."}
                    </FieldDescription>
                  )}
                  <FieldError id="pin-error">{fieldErrors.pin}</FieldError>
                </Field>
              </FieldGroup>

              {errorMessage && (
                <p className="text-sm text-destructive" role="alert">
                  {errorMessage}
                </p>
              )}

              <Button
                type="submit"
                disabled={
                  loginMutation.isPending ||
                  staffQuery.isLoading ||
                  !canSubmit
                }
                className="h-12 w-full rounded-xl font-semibold shadow-sm"
              >
                {loginMutation.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <LogIn className="size-4" />
                )}
                {loginMutation.isPending ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Use your assigned staff PIN. Access is recorded to this
                register.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default LoginPage;
