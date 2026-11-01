"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { Check, LoaderCircle, ReceiptText, Settings2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useTaxSettings,
  useUpdateTaxSettings,
} from "@/lib/hooks/settings.hooks";

type TaxSettingsDraft = {
  taxEnabled: boolean;
  taxRatePercent: string;
};

function percentageToBasisPoints(value: string): number | null {
  const match = /^(100|[0-9]{1,2})(?:\.([0-9]{1,2}))?$/.exec(value.trim());
  if (!match) return null;

  const basisPoints = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isInteger(basisPoints) && basisPoints <= 10_000
    ? basisPoints
    : null;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message ?? "Could not save tax settings.";
  }
  return "Could not save tax settings.";
}

const SettingsPage = () => {
  const settingsQuery = useTaxSettings();
  const updateSettings = useUpdateTaxSettings();
  const [draft, setDraft] = useState<TaxSettingsDraft | null>(null);
  const [rateError, setRateError] = useState("");
  const [saved, setSaved] = useState(false);

  const settings = settingsQuery.data;
  const values = draft ?? {
    taxEnabled: settings?.taxEnabled ?? true,
    taxRatePercent: settings
      ? (settings.taxRateBps / 100).toFixed(2)
      : "8.00",
  };
  const rateBps = percentageToBasisPoints(values.taxRatePercent);
  const hasChanges =
    !!settings &&
    (values.taxEnabled !== settings.taxEnabled ||
      rateBps !== settings.taxRateBps);

  function updateDraft(changes: Partial<TaxSettingsDraft>) {
    setSaved(false);
    setDraft((current) => ({ ...values, ...current, ...changes }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);

    if (rateBps === null) {
      setRateError("Enter a tax rate from 0% to 100%, with up to 2 decimals.");
      return;
    }

    setRateError("");
    updateSettings.mutate(
      { taxEnabled: values.taxEnabled, taxRateBps: rateBps },
      {
        onSuccess: () => {
          setDraft(null);
          setSaved(true);
        },
      },
    );
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-6 pt-2">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings2 className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="text-base text-muted-foreground">
              Configure how tax is calculated at checkout.
            </p>
          </div>
        </div>
      </header>

      {settingsQuery.isError && (
        <Alert variant="destructive">
          <AlertTitle>Settings could not be loaded</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>Check your connection, then try loading the settings again.</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => settingsQuery.refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {settingsQuery.isPending ? (
        <Card>
          <CardContent className="space-y-5 p-6">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-11 w-64" />
          </CardContent>
        </Card>
      ) : settings ? (
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ReceiptText className="size-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl">Checkout tax</CardTitle>
                  <CardDescription className="text-base">
                    Choose whether tax is added to new orders and set the rate.
                    Saved orders keep their original totals.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between gap-6 rounded-xl border border-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <FieldLabel htmlFor="tax-enabled" className="text-base font-semibold">
                    Charge tax at checkout
                  </FieldLabel>
                  <FieldDescription className="text-sm">
                    {values.taxEnabled
                      ? "Tax is included in totals for new orders."
                      : "Tax is not added to new orders."}
                  </FieldDescription>
                </div>
                <Switch
                  id="tax-enabled"
                  checked={values.taxEnabled}
                  onCheckedChange={(taxEnabled) => updateDraft({ taxEnabled })}
                  aria-label="Charge tax at checkout"
                />
              </div>

              <Field className="max-w-xs gap-2">
                <FieldLabel htmlFor="tax-rate" className="text-base font-semibold">
                  Tax rate
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="tax-rate"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.01"
                    value={values.taxRatePercent}
                    onChange={(event) => {
                      setRateError("");
                      updateDraft({ taxRatePercent: event.target.value });
                    }}
                    onBlur={() => {
                      if (percentageToBasisPoints(values.taxRatePercent) === null) {
                        setRateError(
                          "Enter a tax rate from 0% to 100%, with up to 2 decimals.",
                        );
                      }
                    }}
                    aria-invalid={!!rateError}
                    aria-describedby={rateError ? "tax-rate-error" : "tax-rate-hint"}
                    className="h-12 pr-10 text-lg tabular-nums"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
                {rateError ? (
                  <p id="tax-rate-error" role="alert" className="text-sm text-destructive">
                    {rateError}
                  </p>
                ) : (
                  <FieldDescription id="tax-rate-hint">
                    Enter a percentage between 0 and 100. The rate is saved to
                    two decimal places.
                  </FieldDescription>
                )}
              </Field>
            </CardContent>
          </Card>

          {updateSettings.isError && (
            <Alert variant="destructive">
              <AlertTitle>Tax settings were not saved</AlertTitle>
              <AlertDescription>{getErrorMessage(updateSettings.error)}</AlertDescription>
            </Alert>
          )}
          {saved && (
            <Alert>
              <Check aria-hidden="true" />
              <AlertTitle>Settings saved</AlertTitle>
              <AlertDescription>
                New orders will use the updated tax settings.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {values.taxEnabled
                ? `Current checkout tax: ${values.taxRatePercent}%`
                : "Tax is currently turned off."}
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={
                !hasChanges ||
                updateSettings.isPending ||
                rateBps === null
              }
            >
              {updateSettings.isPending ? (
                <>
                  <LoaderCircle className="animate-spin" />
                  Saving settings…
                </>
              ) : (
                "Save settings"
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
};

export default SettingsPage;
