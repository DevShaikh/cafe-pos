"use client";

import { useOrderStore } from "@/store/order.store";
import { useOrders } from "@/lib/hooks/order.hooks";
import { toReceipt } from "@/lib/services/order.service";
import { formatPaisa } from "@/lib/utils";
import { Banknote, Receipt, TrendingUp } from "lucide-react";

const ReportsPage = () => {
  const { receipts } = useOrderStore();
  const ordersQuery = useOrders();
  const allReceipts = [
    ...receipts,
    ...(ordersQuery.data ?? []).map(toReceipt),
  ];

  // 1. Filter for PAID receipts only
  const paidReceipts = allReceipts.filter((r) => r.status === "PAID");

  // 2. Calculate Metrics
  const totalCashPaisa = paidReceipts.reduce(
    (sum, receipt) => sum + receipt.totalPaisa,
    0,
  );
  const totalOrders = paidReceipts.length;
  const averageOrderPaisa =
    totalOrders > 0 ? Math.round(totalCashPaisa / totalOrders) : 0;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto pt-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sales Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Summary of completed sales, including older receipts saved on this device.
        </p>
      </div>

      {ordersQuery.isError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Server sales could not be loaded, so totals include only device-saved receipts.
        </p>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Cash Collected */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Payments Collected
            </p>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Banknote size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-foreground">
              {formatPaisa(totalCashPaisa)}
            </h3>
          </div>
        </div>

        {/* Card 2: Paid Orders */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Paid Orders
            </p>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Receipt size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-foreground">
              {totalOrders}
            </h3>
          </div>
        </div>

        {/* Card 3: Average Order */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Average Order
            </p>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-foreground">
              {formatPaisa(averageOrderPaisa)}
            </h3>
          </div>
        </div>
      </div>

      {/* Placeholder for Step 2 (Sales by Order Type) */}
      <div className="mt-4 rounded-2xl border-2 border-dashed border-border p-12 text-center text-muted-foreground">
        Sales by order type will go here in Step 2.
      </div>
    </div>
  );
};

export default ReportsPage;
