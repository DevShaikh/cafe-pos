"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useOrderStore, useOrderActions } from "@/store/order.store";
import {
  useInfiniteOrders,
  useRecordOrderPayment,
} from "@/lib/hooks/order.hooks";
import { toReceipt } from "@/lib/services/order.service";
import { createUuid, formatPaisa } from "@/lib/utils";
import {
  dateIsInRange,
  dateRangeIsValid,
  makeDateFilters,
} from "@/lib/date-range";
import type { PaymentMethod } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
const ORDERS_PER_PAGE = 10;
const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: "Cash",
  EASYPAISA: "Easypaisa",
  CARD_MANUAL: "Card / bank",
  OTHER: "Other",
};

const isPaymentMethod = (value: string): value is PaymentMethod =>
  paymentMethods.some((method) => method.value === value);

const OrdersPage = () => {
  const { receipts: localReceipts } = useOrderStore();
  const { markAsPaid } = useOrderActions();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PLACED" | "PAID">(
    "ALL",
  );
  const [pageIndex, setPageIndex] = useState(0);
  const validRange = dateRangeIsValid(fromDate, toDate);
  const normalizedSearch = search.trim();
  const filters = {
    ...makeDateFilters(fromDate, toDate),
    ...(normalizedSearch ? { search: normalizedSearch } : {}),
    ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
  };
  const ordersQuery = useInfiniteOrders(filters, validRange);
  const paymentMutation = useRecordOrderPayment();
  const [methods, setMethods] = useState<Record<string, PaymentMethod>>({});
  const paymentKeys = useRef<
    Record<string, { method: PaymentMethod; key: string }>
  >({});

  const localFilteredReceipts = localReceipts.filter(
    (receipt) =>
      dateIsInRange(receipt.createdAt, fromDate, toDate) &&
      (statusFilter === "ALL" ||
        (statusFilter === "PLACED" && receipt.status === "UNPAID") ||
        (statusFilter === "PAID" && receipt.status === "PAID")) &&
      String(receipt.receiptNumber)
        .toLowerCase()
        .includes(normalizedSearch.toLowerCase()),
  );
  const allReceipts = [
    ...localFilteredReceipts.map((receipt) => ({
      receipt,
      serverBacked: false,
    })),
    ...(ordersQuery.data?.pages.flatMap((page) => page.items) ?? []).map(
      (order) => ({
        receipt: toReceipt(order),
        serverBacked: true,
      }),
    ),
  ].sort(
    (a, b) => Date.parse(b.receipt.createdAt) - Date.parse(a.receipt.createdAt),
  );
  const loadedServerCount =
    ordersQuery.data?.pages.reduce(
      (count, page) => count + page.items.length,
      0,
    ) ?? 0;
  const totalCount =
    (ordersQuery.data?.pages[0]?.totalCount ?? 0) +
    localFilteredReceipts.length;
  const receipts = allReceipts.slice(
    pageIndex * ORDERS_PER_PAGE,
    (pageIndex + 1) * ORDERS_PER_PAGE,
  );
  const paidReceipts = receipts.filter((row) => row.receipt.status === "PAID");
  const unpaidCount =
    localReceipts.filter(
      (receipt) =>
        receipt.status === "UNPAID" &&
        dateIsInRange(receipt.createdAt, fromDate, toDate) &&
        String(receipt.receiptNumber)
          .toLowerCase()
          .includes(normalizedSearch.toLowerCase()),
    ).length + (ordersQuery.data?.pages[0]?.unpaidCount ?? 0);

  const markPaid = (row: (typeof receipts)[number]) => {
    if (row.serverBacked) {
      const method = methods[row.receipt.id] ?? "CASH";
      const pendingPayment = paymentKeys.current[row.receipt.id];
      const idempotencyKey =
        pendingPayment?.method === method
          ? pendingPayment.key
          : createUuid();
      paymentKeys.current[row.receipt.id] = { method, key: idempotencyKey };
      paymentMutation.mutate(
        {
          orderId: row.receipt.id,
          method,
          idempotencyKey,
        },
        {
          onSuccess: () => {
            delete paymentKeys.current[row.receipt.id];
            if (statusFilter === "PLACED") setPageIndex(0);
          },
        },
      );
    } else {
      markAsPaid(row.receipt.id);
      if (statusFilter === "PLACED") setPageIndex(0);
    }
  };

  const visibleReceipts = receipts.filter(
    (row) => row.receipt.status === "PAID" || row.receipt.status === "UNPAID",
  );

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-4 pt-2">
      <div className="grid items-end gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_190px_190px_190px_auto]">
        <Field className="gap-2">
          <FieldLabel htmlFor="orders-search" className="text-sm font-semibold">
            Search receipt
          </FieldLabel>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="orders-search"
              type="search"
              maxLength={80}
              placeholder="Enter receipt number"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageIndex(0);
              }}
              className="h-11 pl-10 pr-10 text-base"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Clear receipt search"
                onClick={() => {
                  setSearch("");
                  setPageIndex(0);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <X />
              </Button>
            )}
          </div>
        </Field>
        <Field className="gap-2">
          <FieldLabel
            htmlFor="orders-from-date"
            className="text-sm font-semibold"
          >
            From
          </FieldLabel>
          <Input
            id="orders-from-date"
            type="date"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setPageIndex(0);
            }}
            className="h-11 w-full text-base"
          />
        </Field>
        <Field className="gap-2">
          <FieldLabel
            htmlFor="orders-to-date"
            className="text-sm font-semibold"
          >
            To
          </FieldLabel>
          <Input
            id="orders-to-date"
            type="date"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setPageIndex(0);
            }}
            className="h-11 w-full text-base"
          />
        </Field>
        <Field className="gap-2">
          <FieldLabel
            htmlFor="orders-status-filter"
            className="text-sm font-semibold"
          >
            Status
          </FieldLabel>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              if (value === "ALL" || value === "PLACED" || value === "PAID") {
                setStatusFilter(value);
                setPageIndex(0);
              }
            }}
          >
            <SelectTrigger id="orders-status-filter" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All orders</SelectItem>
              <SelectItem value="PLACED">Unpaid only</SelectItem>
              <SelectItem value="PAID">Paid only</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {(fromDate || toDate || search || statusFilter !== "ALL") && (
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={() => {
              setFromDate("");
              setToDate("");
              setSearch("");
              setStatusFilter("ALL");
              setPageIndex(0);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
      {!validRange && (
        <p role="alert" className="text-sm text-destructive">
          The end date must be the same as or later than the start date.
        </p>
      )}
      {ordersQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading server orders…</p>
      )}
      {ordersQuery.isError && (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          Server orders could not be loaded. Device-saved receipts remain
          available.
        </p>
      )}
      {paymentMutation.isError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <span>
            Payment could not be confirmed. Refresh the order list and check its
            status before retrying.
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

      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold text-foreground">Order history</h3>
          <Badge variant="default" className="px-3 py-2 h-6 text-sm">
            {unpaidCount} unpaid
          </Badge>
          <Badge variant="secondary" className="px-3 py-2 h-6 text-sm">
            {paidReceipts.length} paid on this page
          </Badge>
        </div>
        {visibleReceipts.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No orders match the selected filters.
          </div>
        ) : (
          <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            <Table className="text-base">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-12 px-4 text-sm">Receipt</TableHead>
                  <TableHead className="h-12 px-4 text-sm">Type</TableHead>
                  <TableHead className="h-12 px-4 text-sm">
                    Date &amp; time
                  </TableHead>
                  <TableHead className="h-12 px-4 text-sm">Status</TableHead>
                  <TableHead className="h-12 px-4 text-right text-sm">
                    Amount
                  </TableHead>
                  <TableHead className="h-12 px-4 text-sm">
                    Payment method
                  </TableHead>
                  <TableHead className="h-12 px-4 text-right text-sm">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleReceipts.map((row) => {
                  const { receipt } = row;
                  const isPaid = receipt.status === "PAID";
                  const date = isPaid
                    ? (receipt.paidAt ?? receipt.createdAt)
                    : receipt.createdAt;

                  return (
                    <TableRow key={receipt.id}>
                      <TableCell className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">
                            #{receipt.receiptNumber}
                          </span>
                          {!row.serverBacked && (
                            <Badge variant="outline" className="text-xs">
                              This device
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className="px-2.5 py-1 text-sm capitalize"
                        >
                          {receipt.orderType.replace("_", " ").toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {new Date(date).toLocaleString("en-PK", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          variant={isPaid ? "secondary" : "default"}
                          className="px-2.5 py-1 text-sm"
                        >
                          {isPaid ? "Paid" : "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatPaisa(receipt.totalPaisa)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {!isPaid && row.serverBacked ? (
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
                              className="h-10 w-40"
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
                        ) : !isPaid ? (
                          <span className="text-sm text-muted-foreground">
                            Local receipt
                          </span>
                        ) : receipt.paymentMethod ? (
                          <span>{paymentMethodLabels[receipt.paymentMethod]}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {!isPaid ? (
                          <Button
                            type="button"
                            onClick={() => markPaid(row)}
                            disabled={paymentMutation.isPending}
                            size="default"
                          >
                            <CheckCircle2 />
                            {paymentMutation.isPending
                              ? "Saving…"
                              : "Mark as paid"}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
      {totalCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-sm text-muted-foreground">
            Showing {pageIndex * ORDERS_PER_PAGE + (receipts.length ? 1 : 0)}–
            {Math.min((pageIndex + 1) * ORDERS_PER_PAGE, totalCount)} of{" "}
            {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setPageIndex((current) => Math.max(0, current - 1))
              }
              disabled={pageIndex === 0 || ordersQuery.isFetchingNextPage}
            >
              <ChevronLeft />
              Previous
            </Button>
            <span className="min-w-20 text-center text-sm text-muted-foreground">
              Page {pageIndex + 1} of {Math.ceil(totalCount / ORDERS_PER_PAGE)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                const nextPageIndex = pageIndex + 1;
                const nextPageStart = nextPageIndex * ORDERS_PER_PAGE;
                if (
                  nextPageStart < loadedServerCount ||
                  (!ordersQuery.hasNextPage &&
                    nextPageStart < allReceipts.length)
                ) {
                  setPageIndex((current) => current + 1);
                  return;
                }
                if (ordersQuery.hasNextPage) {
                  const result = await ordersQuery.fetchNextPage();
                  const loadedOrderCount =
                    result.data?.pages.reduce(
                      (count, page) => count + page.items.length,
                      0,
                    ) ?? 0;
                  const loadedCount =
                    loadedOrderCount + localFilteredReceipts.length;
                  if (
                    nextPageStart < loadedOrderCount ||
                    (!result.hasNextPage && nextPageStart < loadedCount)
                  ) {
                    setPageIndex(nextPageIndex);
                  }
                }
              }}
              disabled={
                ordersQuery.isFetchingNextPage ||
                ((pageIndex + 1) * ORDERS_PER_PAGE >= totalCount &&
                  !ordersQuery.hasNextPage)
              }
            >
              {ordersQuery.isFetchingNextPage ? "Loading…" : "Next"}
              {!ordersQuery.isFetchingNextPage && <ChevronRight />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
