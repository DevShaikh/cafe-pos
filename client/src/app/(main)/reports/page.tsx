"use client";

import { useState, type ReactNode } from "react";
import { useOrderStore } from "@/store/order.store";
import { useSalesReport } from "@/lib/hooks/order.hooks";
import { dateIsInRange, dateRangeIsValid, makeDateFilters } from "@/lib/date-range";
import { formatPaisa } from "@/lib/utils";
import type { OrderType } from "@/types";
import { Banknote, Receipt, TrendingUp } from "lucide-react";

const ReportsPage = () => {
  const { receipts } = useOrderStore();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const validRange = dateRangeIsValid(fromDate, toDate);
  const filters = makeDateFilters(fromDate, toDate);
  const reportQuery = useSalesReport(filters, validRange);

  const localPaid = receipts.filter(
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
    <div className="flex h-full flex-col gap-6 overflow-y-auto pt-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sales Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Payments are grouped by the date they were recorded. Dates use this device&apos;s local timezone.
        </p>
      </div>

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
      {reportQuery.isLoading && (
        <p className="text-sm text-muted-foreground">Loading report…</p>
      )}
      {reportQuery.isError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Server report data could not be loaded. Totals include only device-saved receipts.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard title="Payments Collected" value={formatPaisa(totalPaisa)} icon={<Banknote size={20} />} />
        <SummaryCard title="Paid Orders" value={String(totalOrders)} icon={<Receipt size={20} />} />
        <SummaryCard title="Average Order" value={formatPaisa(averageOrderPaisa)} icon={<TrendingUp size={20} />} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Sales by order type</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {([
            ["DINE_IN", "Dine in"],
            ["TAKEAWAY", "Takeaway"],
          ] as const).map(([type, label]) => (
            <div key={type} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="mt-3 text-2xl font-bold text-foreground">
                {formatPaisa(orderTypeTotals[type].amount)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {orderTypeTotals[type].count} paid orders
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="rounded-full bg-primary/10 p-2 text-primary">{icon}</div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-foreground">{value}</h3>
      </div>
    </div>
  );
}

export default ReportsPage;
