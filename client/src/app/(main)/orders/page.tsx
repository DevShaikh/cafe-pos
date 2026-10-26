"use client";

import { useState } from "react";
import { CheckCircle2, Receipt as ReceiptIcon, Clock } from "lucide-react";
import { useOrderStore, useOrderActions } from "@/store/order.store";
import { useInfiniteOrders, useRecordOrderPayment } from "@/lib/hooks/order.hooks";
import { toReceipt } from "@/lib/services/order.service";
import { formatPaisa } from "@/lib/utils";
import { dateIsInRange, dateRangeIsValid, makeDateFilters } from "@/lib/date-range";
import type { PaymentMethod } from "@/types";

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "EASYPAISA", label: "Easypaisa" },
  { value: "CARD_MANUAL", label: "Card / bank" },
  { value: "OTHER", label: "Other" },
];

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
      <div
        key={receipt.id}
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <ReceiptIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-bold text-foreground">#{receipt.receiptNumber}</h4>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                {receipt.orderType.replace("_", " ").toLowerCase()}
              </span>
              {!row.serverBacked && (
                <span className="text-xs text-muted-foreground">Saved on this device</span>
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
                <select
                  aria-label={`Payment method for receipt ${receipt.receiptNumber}`}
                  value={methods[receipt.id] ?? "CASH"}
                  onChange={(event) =>
                    setMethods((current) => ({ ...current, [receipt.id]: event.target.value as PaymentMethod }))
                  }
                  disabled={paymentMutation.isPending}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  {paymentMethods.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => markPaid(row)}
                disabled={paymentMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
                {paymentMutation.isPending ? "Saving…" : "Mark as paid"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <label className="grid gap-1 text-sm text-muted-foreground">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        <label className="grid gap-1 text-sm text-muted-foreground">
          To
          <input
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-foreground"
          />
        </label>
        {(fromDate || toDate) && (
          <button
            onClick={() => { setFromDate(""); setToDate(""); }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
          >
            Clear dates
          </button>
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
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Payment could not be confirmed. Refresh the order list and check its status before retrying.
          <button
            onClick={() => paymentMutation.reset()}
            className="ml-2 font-semibold underline underline-offset-2"
          >
            Dismiss
          </button>
        </p>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Unpaid Orders</h3>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {unpaidCount} pending
          </span>
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
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {paidReceipts.length} paid
          </span>
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
        <button
          onClick={() => ordersQuery.fetchNextPage()}
          disabled={ordersQuery.isFetchingNextPage}
          className="mx-auto rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
        >
          {ordersQuery.isFetchingNextPage ? "Loading…" : "Load more orders"}
        </button>
      )}
    </div>
  );
};

export default OrdersPage;
