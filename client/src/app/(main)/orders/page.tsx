"use client";

import { useState } from "react";
import { CheckCircle2, Receipt as ReceiptIcon, Clock } from "lucide-react";
import { useOrderStore, useOrderActions } from "@/store/order.store";
import { useInfiniteOrders, useRecordOrderPayment } from "@/lib/hooks/order.hooks";
import { toReceipt } from "@/lib/services/order.service";
import { formatPaisa } from "@/lib/utils";
import { dateIsInRange, dateRangeIsValid, makeDateFilters } from "@/lib/date-range";
import type { PaymentMethod } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "EASYPAISA", label: "Easypaisa" },
  { value: "CARD_MANUAL", label: "Card / bank" },
  { value: "OTHER", label: "Other" },
];

const isPaymentMethod = (value: string): value is PaymentMethod =>
  paymentMethods.some((method) => method.value === value);

const OrdersPage = () => {
  const { receipts: localReceipts } = useOrderStore();
  const { markAsPaid } = useOrderActions();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const validRange = dateRangeIsValid(fromDate, toDate);
  const ordersQuery = useInfiniteOrders(
    makeDateFilters(fromDate, toDate),
    validRange,
  );
  const paymentMutation = useRecordOrderPayment();
  const [methods, setMethods] = useState<Record<string, PaymentMethod>>({});

  const receipts = [
    ...localReceipts
      .filter((receipt) => dateIsInRange(receipt.createdAt, fromDate, toDate))
      .map((receipt) => ({ receipt, serverBacked: false })),
    ...(ordersQuery.data?.pages.flatMap((page) => page.items) ?? []).map((order) => ({
      receipt: toReceipt(order),
      serverBacked: true,
    })),
  ].sort(
    (a, b) => Date.parse(b.receipt.createdAt) - Date.parse(a.receipt.createdAt),
  );
  const unpaidReceipts = receipts.filter((row) => row.receipt.status === "UNPAID");
  const paidReceipts = receipts.filter((row) => row.receipt.status === "PAID");
  const unpaidCount =
    localReceipts.filter(
      (receipt) =>
        receipt.status === "UNPAID" &&
        dateIsInRange(receipt.createdAt, fromDate, toDate),
    ).length + (ordersQuery.data?.pages[0]?.unpaidCount ?? 0);

  const markPaid = (row: (typeof receipts)[number]) => {
    if (row.serverBacked) {
      paymentMutation.mutate({
        orderId: row.receipt.id,
        method: methods[row.receipt.id] ?? "CASH",
        idempotencyKey: crypto.randomUUID(),
      });
    } else {
      markAsPaid(row.receipt.id);
    }
  };

  const receiptCard = (row: (typeof receipts)[number], paid: boolean) => {
    const { receipt } = row;
    return (
      <Card
        key={receipt.id}
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <ReceiptIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-bold text-foreground">#{receipt.receiptNumber}</h4>
              <Badge variant="secondary" className="capitalize">
                {receipt.orderType.replace("_", " ").toLowerCase()}
              </Badge>
              {!row.serverBacked && (
                <Badge variant="outline">Saved on this device</Badge>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Clock size={14} />
              {new Date(paid ? receipt.paidAt ?? receipt.createdAt : receipt.createdAt).toLocaleTimeString("en-PK", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{paid ? "Total" : "Due"}</p>
            <p className="text-lg font-bold text-foreground">{formatPaisa(receipt.totalPaisa)}</p>
          </div>
          {!paid && (
            <>
              {row.serverBacked && (
                <Select
                  value={methods[receipt.id] ?? "CASH"}
                  onValueChange={(value) => {
                    if (isPaymentMethod(value)) {
                      setMethods((current) => ({
                        ...current,
                        [receipt.id]: value,
                      }));
                    }
                  }}
                  disabled={paymentMutation.isPending}
                >
                  <SelectTrigger
                    aria-label={`Payment method for receipt ${receipt.receiptNumber}`}
                    className="w-36"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                type="button"
                onClick={() => markPaid(row)}
                disabled={paymentMutation.isPending}
                size="lg"
                className="h-12 rounded-xl px-5 py-3 shadow-sm transition-transform active:scale-[0.98]"
              >
                <CheckCircle2 size={18} />
                {paymentMutation.isPending ? "Saving…" : "Mark as paid"}
              </Button>
            </>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <Field className="gap-1">
          <FieldLabel htmlFor="orders-from-date">From</FieldLabel>
          <Input
            id="orders-from-date"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-10 w-auto"
          />
        </Field>
        <Field className="gap-1">
          <FieldLabel htmlFor="orders-to-date">To</FieldLabel>
          <Input
            id="orders-to-date"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-10 w-auto"
          />
        </Field>
        {(fromDate || toDate) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setFromDate(""); setToDate(""); }}
          >
            Clear dates
          </Button>
        )}
      </div>
      {!validRange && (
        <p role="alert" className="text-sm text-destructive">
          The end date must be the same as or later than the start date.
        </p>
      )}
      {ordersQuery.isLoading && <p className="text-sm text-muted-foreground">Loading server orders…</p>}
      {ordersQuery.isError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Server orders could not be loaded. Device-saved receipts remain available.
        </p>
      )}
      {paymentMutation.isError && (
        <div role="alert" className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <span>
            Payment could not be confirmed. Refresh the order list and check its status before retrying.
          </span>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => paymentMutation.reset()}
          >
            Dismiss
          </Button>
        </div>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Unpaid Orders</h3>
          <Badge variant="default" className="px-3 py-1 text-sm">
            {unpaidCount} pending
          </Badge>
        </div>
        {unpaidReceipts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No unpaid receipts right now.
          </div>
        ) : (
          <div className="grid gap-4">
            {unpaidReceipts.map((row) => receiptCard(row, false))}
          </div>
        )}
      </section>

      <section className="mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-muted-foreground">Paid Orders</h3>
          <Badge variant="secondary">
            {paidReceipts.length} paid
          </Badge>
        </div>
        {paidReceipts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No completed payments yet.
          </div>
        ) : (
          <div className="grid gap-3">{paidReceipts.map((row) => receiptCard(row, true))}</div>
        )}
      </section>
      {ordersQuery.hasNextPage && (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => ordersQuery.fetchNextPage()}
          disabled={ordersQuery.isFetchingNextPage}
          className="mx-auto rounded-xl px-5 py-3"
        >
          {ordersQuery.isFetchingNextPage ? "Loading…" : "Load more orders"}
        </Button>
      )}
    </div>
  );
};

export default OrdersPage;
