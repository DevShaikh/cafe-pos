"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import {
  Check,
  Download,
  LoaderCircle,
  ReceiptText,
  Settings2,
  Upload,
} from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveReceiptPaperWidth,
  useReceiptPaperWidth,
} from "@/lib/receipt-paper-width";
import {
  useTaxSettings,
  useUpdateTaxSettings,
} from "@/lib/hooks/settings.hooks";

type TaxSettingsDraft = {
  taxEnabled: boolean;
  taxRatePercent: string;
  orderTypeVisibilityEnabled: boolean;
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

function getDesktopErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The desktop operation could not be completed.";
}

const SettingsPage = () => {
  const settingsQuery = useTaxSettings();
  const updateSettings = useUpdateTaxSettings();
  const receiptPaperWidth = useReceiptPaperWidth();
  const [draft, setDraft] = useState<TaxSettingsDraft | null>(null);
  const [rateError, setRateError] = useState("");
  const [saved, setSaved] = useState(false);
  const [backupPending, setBackupPending] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const [paperWidthError, setPaperWidthError] = useState("");

  const settings = settingsQuery.data;
  const values = draft ?? {
    taxEnabled: settings?.taxEnabled ?? false,
    taxRatePercent: settings
      ? (settings.taxRateBps / 100).toFixed(2)
      : "0.00",
    orderTypeVisibilityEnabled: settings?.orderTypeVisibilityEnabled ?? false,
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
      { taxEnabled: values.taxEnabled, taxRateBps: rateBps, orderTypeVisibilityEnabled: values.orderTypeVisibilityEnabled },
      {
        onSuccess: () => {
          setDraft(null);
          setSaved(true);
        },
      },
    );
  }

  async function handleCreateBackup() {
    setBackupPending(true);
    setBackupMessage("");
    setBackupError("");
    try {
      if (!window.cafePosDesktop) {
        throw new Error("Manual backups are available in the installed desktop app.");
      }
      const result = await window.cafePosDesktop.createBackup();
      if (!result.canceled && result.path) {
        setBackupMessage(`Backup saved to ${result.path}`);
      }
    } catch (error) {
      setBackupError(getDesktopErrorMessage(error));
    } finally {
      setBackupPending(false);
    }
  }

  async function handleRestoreBackup() {
    setBackupPending(true);
    setBackupMessage("");
    setBackupError("");
    try {
      if (!window.cafePosDesktop) {
        throw new Error("Restore is available in the installed desktop app.");
      }
      const result = await window.cafePosDesktop.restoreBackup();
      if (!result.canceled && result.path) {
        setBackupMessage("Restore complete. Reloading Cafe POS…");
        window.setTimeout(() => window.location.reload(), 1200);
      }
    } catch (error) {
      setBackupError(getDesktopErrorMessage(error));
    } finally {
      setBackupPending(false);
    }
  }

  function handleReceiptWidthChange(value: string) {
    const width = Number(value);
    if (width !== 58 && width !== 80) return;
    try {
      saveReceiptPaperWidth(width);
      setPaperWidthError("");
    } catch {
      setPaperWidthError("Could not save the receipt paper width on this computer.");
    }
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
                    type="text"
                    inputMode="decimal"
                    maxLength={6}
                    value={values.taxRatePercent}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (
                        /^\d{0,3}(?:\.\d{0,2})?$/.test(value) &&
                        (!value || Number(value) <= 100)
                      ) {
                        setRateError("");
                        updateDraft({ taxRatePercent: value });
                      }
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

      <Card className="max-w-3xl">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Order Type Tracking</CardTitle>
          <CardDescription className="text-base">
            Toggle whether both Dine-in and Takeaway orders are tracked separately. When disabled, all orders will be recorded without order type distinction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-col gap-3">
            <Field>
              <FieldLabel htmlFor="order-type-tracking-toggle">Enable Order Type Tracking</FieldLabel>
              <FieldDescription>Toggle this on to track both Dine-in and Takeaway orders separately. Turn it off to record all orders without distinguishing between order types.</FieldDescription>
              <div className="flex items-center gap-3">
                <Switch
                  id="order-type-tracking-toggle"
                  checked={values.orderTypeVisibilityEnabled ?? false}
                  onCheckedChange={(checked) =>
                    updateDraft({ orderTypeVisibilityEnabled: checked })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {(values.orderTypeVisibilityEnabled ?? false) ? "✓ Order type tracking is enabled" : "✗ Order type tracking is disabled"}
                </span>
              </div>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Receipt printer</CardTitle>
          <CardDescription className="text-base">
            Choose the paper width used for new receipt prints on this computer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          <Field className="max-w-sm gap-2">
            <FieldLabel htmlFor="receipt-paper-width">Paper width</FieldLabel>
            <Select
              value={String(receiptPaperWidth)}
              onValueChange={handleReceiptWidthChange}
            >
              <SelectTrigger id="receipt-paper-width" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58">58 mm</SelectItem>
                <SelectItem value="80">80 mm</SelectItem>
              </SelectContent>
            </Select>
            {paperWidthError && (
              <p role="alert" className="text-sm text-destructive">
                {paperWidthError}
              </p>
            )}
          </Field>
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">Backup and restore</CardTitle>
          <CardDescription className="text-base">
            Save a copy of the sales database and product photos to a folder you
            choose. Keep a backup on a separate USB drive or other device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={backupPending}
              onClick={handleCreateBackup}
            >
              {backupPending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Download aria-hidden="true" />
              )}
              Create backup
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={backupPending}
              onClick={handleRestoreBackup}
            >
              {backupPending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              Restore backup
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Restore replaces the current orders, settings, and product photos.
            Cafe POS creates a safety backup before restoring.
          </p>
          {backupError && (
            <Alert variant="destructive">
              <AlertTitle>Backup operation failed</AlertTitle>
              <AlertDescription>{backupError}</AlertDescription>
            </Alert>
          )}
          {backupMessage && (
            <Alert>
              <AlertTitle>Backup status</AlertTitle>
              <AlertDescription className="break-all">
                {backupMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
