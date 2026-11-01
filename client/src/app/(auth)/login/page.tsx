"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import { LoaderCircle, LogIn } from "lucide-react";
import { authKeys, useCurrentStaff } from "@/lib/hooks/auth.hooks";
import { getActiveStaff, login } from "@/lib/services/auth.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const loginFormSchema = z.object({
  staffId: z.uuid("Select an active staff member."),
  pin: z.string().min(4, "PIN must be at least 4 characters."),
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
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm gap-0 rounded-2xl p-8 shadow-sm">
        <CardContent className="p-0">
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
              className="space-y-4"
              onSubmit={handleSubmit}
              aria-busy={loginMutation.isPending}
              noValidate
            >
              <FieldGroup>
                <Field data-invalid={Boolean(fieldErrors.staffId)}>
                  <FieldLabel htmlFor="staffId">Staff member</FieldLabel>
                  <Select
                    value={staffId}
                    onValueChange={(value) => {
                      setPreferredStaffId(value);
                      setFieldErrors((current) => ({
                        ...current,
                        staffId: undefined,
                      }));
                    }}
                  >
                    <SelectTrigger
                      id="staffId"
                      className="h-11 w-full"
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
                  <FieldLabel htmlFor="pin">PIN</FieldLabel>
                  <Input
                    id="pin"
                    required
                    type="password"
                    inputMode="numeric"
                    autoComplete="current-password"
                    value={pin}
                    onChange={(event) => {
                      setPin(event.target.value);
                      setFieldErrors((current) => ({
                        ...current,
                        pin: undefined,
                      }));
                    }}
                    className="h-11"
                    aria-invalid={Boolean(fieldErrors.pin)}
                    aria-describedby={fieldErrors.pin ? "pin-error" : undefined}
                  />
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
                disabled={loginMutation.isPending}
                className="h-11 w-full"
              >
                {loginMutation.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <LogIn className="size-4" />
                )}
                Sign in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default LoginPage;
