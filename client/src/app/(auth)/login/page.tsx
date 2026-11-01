"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { z } from "zod";
import { LoaderCircle, LogIn } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { authKeys, useCurrentStaff } from "@/lib/hooks/auth.hooks";
import {
  getActiveStaff,
  getSetupStatus,
  login,
  setupInitialAdmin,
} from "@/lib/services/auth.service";
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
import { Input } from "@/components/ui/input";
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
const initialSetupFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter a name with at least 2 characters.")
      .max(80),
    pin: z.string().regex(/^\d{4}$/, "Choose a 4-digit PIN."),
    pinConfirmation: z.string().regex(/^\d{4}$/, "Confirm the 4-digit PIN."),
  })
  .refine((value) => value.pin === value.pinConfirmation, {
    path: ["pinConfirmation"],
    message: "PINs do not match.",
  });

const LoginPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useCurrentStaff();
  const [preferredStaffId, setPreferredStaffId] = useState("");
  const [pin, setPin] = useState("");
  const [setupName, setSetupName] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupPinConfirmation, setSetupPinConfirmation] = useState("");
  const [setupError, setSetupError] = useState("");
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
  const setupQuery = useQuery({
    queryKey: ["auth", "setup-status"],
    queryFn: async ({ signal }) => {
      const response = await getSetupStatus(signal);
      return response.data.data;
    },
    retry: false,
  });

  const staffId =
    staffQuery.data?.find(({ id }) => id === preferredStaffId)?.id ??
    staffQuery.data?.[0]?.id ??
    "";
  const canSubmit = Boolean(staffId) && /^\d{4}$/.test(pin);

  const finishSignIn = async () => {
    setErrorMessage("");
    await queryClient.invalidateQueries({ queryKey: authKeys.session });
    router.replace("/catalog");
  };

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: finishSignIn,
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
  const setupMutation = useMutation({
    mutationFn: setupInitialAdmin,
    onSuccess: finishSignIn,
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        setSetupError(
          error.response?.data?.error?.message ??
            "Could not complete the initial setup.",
        );
        return;
      }
      setSetupError("Could not complete the initial setup. Please try again.");
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

  const handleSetupSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSetupError("");
    const parsed = initialSetupFormSchema.safeParse({
      name: setupName,
      pin: setupPin,
      pinConfirmation: setupPinConfirmation,
    });
    if (!parsed.success) {
      setSetupError(
        parsed.error.issues[0]?.message ?? "Check the setup details.",
      );
      return;
    }
    setupMutation.mutate({
      name: parsed.data.name,
      pin: parsed.data.pin,
    });
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
            <Image
              src="/icon.svg"
              alt=""
              width={56}
              height={56}
              priority
              className="mb-5 size-14 rounded-2xl shadow-sm"
            />
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

          {setupQuery.isPending ? (
            <div className="flex justify-center py-8" role="status">
              <LoaderCircle className="size-6 animate-spin text-primary" />
            </div>
          ) : setupQuery.isError ? (
            <p
              className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              Could not check the initial setup status. Check that the API is
              running.
            </p>
          ) : setupQuery.data.setupRequired ? (
            <form
              className="space-y-5"
              onSubmit={handleSetupSubmit}
              aria-busy={setupMutation.isPending}
              noValidate
            >
              <div className="space-y-1">
                <Badge variant="secondary">First-time setup</Badge>
                <p className="text-sm text-muted-foreground">
                  Create the administrator account for this cafe. Choose a PIN
                  that is not shared or used elsewhere.
                </p>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="setup-name">Administrator name</FieldLabel>
                  <Input
                    id="setup-name"
                    autoComplete="name"
                    maxLength={80}
                    value={setupName}
                    disabled={setupMutation.isPending}
                    onChange={(event) => setSetupName(event.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="setup-pin">Choose a 4-digit PIN</FieldLabel>
                  <InputOTP
                    id="setup-pin"
                    maxLength={4}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoComplete="new-password"
                    value={setupPin}
                    disabled={setupMutation.isPending}
                    onChange={setSetupPin}
                    aria-label="Choose a 4-digit administrator PIN"
                    containerClassName="w-full justify-center"
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
                          className="size-12 rounded-xl border first:border-l bg-background text-xl font-semibold"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </Field>
                <Field>
                  <FieldLabel htmlFor="setup-pin-confirm">
                    Confirm PIN
                  </FieldLabel>
                  <InputOTP
                    id="setup-pin-confirm"
                    maxLength={4}
                    pattern={REGEXP_ONLY_DIGITS}
                    inputMode="numeric"
                    autoComplete="new-password"
                    value={setupPinConfirmation}
                    disabled={setupMutation.isPending}
                    onChange={setSetupPinConfirmation}
                    aria-label="Confirm administrator PIN"
                    containerClassName="w-full justify-center"
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
                          className="size-12 rounded-xl border first:border-l bg-background text-xl font-semibold"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </Field>
              </FieldGroup>
              {setupError && (
                <p className="text-sm text-destructive" role="alert">
                  {setupError}
                </p>
              )}
              <Button
                type="submit"
                className="h-12 w-full rounded-xl font-semibold"
                disabled={
                  setupMutation.isPending ||
                  setupName.trim().length < 2 ||
                  !/^\d{4}$/.test(setupPin) ||
                  !/^\d{4}$/.test(setupPinConfirmation)
                }
              >
                {setupMutation.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <LogIn className="size-4" />
                )}
                {setupMutation.isPending
                  ? "Setting up cafe…"
                  : "Create administrator and continue"}
              </Button>
            </form>
          ) : staffQuery.isLoading ? (
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
                No active staff accounts are available. Ask an administrator to
                reactivate a staff account.
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
