"use client";

import { useState, type ReactNode } from "react";
import { useOrderStore } from "@/store/order.store";
import { useSalesReport } from "@/lib/hooks/order.hooks";
import { useSessions } from "@/lib/hooks/session.hooks";
import { dateIsInRange, dateRangeIsValid, makeDateFilters } from "@/lib/date-range";
import { formatPaisa } from "@/lib/utils";
import type { OrderType } from "@/types";
import { Banknote, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ReportsPage = () => {
  const { receipts } = useOrderStore();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sessionId, setSessionId] = useState("");
  const validRange = dateRangeIsValid(fromDate, toDate);
  const filters = {
    ...makeDateFilters(fromDate, toDate),
    ...(sessionId ? { sessionId } : {}),
  };
  const reportQuery = useSalesReport(filters, validRange);
  const sessionsQuery = useSessions();

  const localPaid = sessionId
    ? []
    : receipts.filter(
        (receipt) =>
          receipt.status === "PAID" &&
          dateIsInRange(receipt.paidAt ?? receipt.createdAt, fromDate, toDate),
      );
  const serverTotalPaisa = reportQuery.data?.totalPaisa ?? 0;
  const serverOrderCount = reportQuery.data?.paidOrderCount ?? 0;
  const localTotalPaisa = localPaid.reduce(
    (sum, receipt) => sum + receipt.totalPaisa,
    0,
  );
  const totalPaisa = serverTotalPaisa + localTotalPaisa;
  const totalOrders = serverOrderCount + localPaid.length;
  const averageOrderPaisa =
    totalOrders > 0 ? Math.round(totalPaisa / totalOrders) : 0;

  const orderTypeTotals: Record<OrderType, { amount: number; count: number }> = {
    DINE_IN: { amount: 0, count: 0 },
    TAKEAWAY: { amount: 0, count: 0 },
  };
  for (const row of reportQuery.data?.byOrderType ?? []) {
    orderTypeTotals[row.orderType].amount += row.totalPaisa;
    orderTypeTotals[row.orderType].count += row.orderCount;
  }
  for (const receipt of localPaid) {
    orderTypeTotals[receipt.orderType].amount += receipt.totalPaisa;
    orderTypeTotals[receipt.orderType].count += 1;
  }

  return (
    <div className="flex min-h-full min-w-0 flex-col gap-5 pt-2">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sales Reports
        </h1>
        <p className="text-base text-muted-foreground">
          Payments are grouped by the date they were recorded. Dates use this device&apos;s local timezone.
        </p>
      </div>

      <div className="grid items-end gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-[190px_190px_minmax(260px,1fr)_auto]">
        <Field className="gap-2">
          <FieldLabel htmlFor="reports-from-date" className="text-sm font-semibold">
            From
          </FieldLabel>
          <Input
            id="reports-from-date"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="h-11 w-full text-base"
          />
        </Field>
        <Field className="gap-2">
          <FieldLabel htmlFor="reports-to-date" className="text-sm font-semibold">
            To
          </FieldLabel>
          <Input
            id="reports-to-date"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="h-11 w-full text-base"
          />
        </Field>
        <Field className="gap-2">
          <FieldLabel htmlFor="reports-session-id" className="text-sm font-semibold">
            Cashier session
          </FieldLabel>
          <Select
            value={sessionId || "all"}
            onValueChange={(value) =>
              setSessionId(value === "all" ? "" : value)
            }
          >
            <SelectTrigger id="reports-session-id" className="h-11 w-full text-base">
              <SelectValue placeholder="All sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sessions</SelectItem>
              {(sessionsQuery.data ?? []).map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {new Date(session.openedAt).toLocaleString("en-PK", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })} ({session.status.toLowerCase()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {(fromDate || toDate || sessionId) && (
          <Button
            type="button"
            variant="ghost"
            size="default"
            onClick={() => { setFromDate(""); setToDate(""); setSessionId(""); }}
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
      {reportQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading report…</p>
      )}
      {reportQuery.isError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Server report data could not be loaded. Totals include only device-saved receipts.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard
          title="Payments collected"
          value={formatPaisa(totalPaisa)}
          detail="Across selected filters"
          icon={<Banknote />}
        />
        <SummaryCard
          title="Paid orders"
          value={String(totalOrders)}
          detail="Completed payments"
          icon={<Receipt />}
        />
        <SummaryCard
          title="Average order"
          value={formatPaisa(averageOrderPaisa)}
          detail="Collected per paid order"
          icon={<TrendingUp />}
        />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Sales by order type
          </h2>
          <p className="text-sm text-muted-foreground">
            Compare paid order volume and collected amounts.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table className="text-base">
            <TableHeader>
              <TableRow>
                <TableHead className="h-12 px-4 text-sm">Order type</TableHead>
                <TableHead className="h-12 px-4 text-right text-sm">
                  Paid orders
                </TableHead>
                <TableHead className="h-12 px-4 text-right text-sm">
                  Average order
                </TableHead>
                <TableHead className="h-12 px-4 text-right text-sm">
                  Payments collected
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {([
                ["DINE_IN", "Dine in"],
                ["TAKEAWAY", "Takeaway"],
              ] as const).map(([type, label]) => (
                <TableRow key={type}>
                  <TableCell className="px-4 py-4 font-medium">
                    {label}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right tabular-nums">
                    {orderTypeTotals[type].count}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right tabular-nums">
                    {formatPaisa(
                      orderTypeTotals[type].count > 0
                        ? Math.round(
                            orderTypeTotals[type].amount /
                              orderTypeTotals[type].count,
                          )
                        : 0,
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right font-semibold tabular-nums">
                    {formatPaisa(orderTypeTotals[type].amount)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-semibold hover:bg-muted/40">
                <TableCell className="px-4 py-4">Total</TableCell>
                <TableCell className="px-4 py-4 text-right tabular-nums">
                  {totalOrders}
                </TableCell>
                <TableCell className="px-4 py-4 text-right tabular-nums">
                  {formatPaisa(averageOrderPaisa)}
                </TableCell>
                <TableCell className="px-4 py-4 text-right tabular-nums">
                  {formatPaisa(totalPaisa)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
};

function SummaryCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">
              {value}
            </h3>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ReportsPage;
