"use client";

import { useOrderStore } from "@/store/order.store";
import { formatPrice } from "@/lib/utils";
import { Banknote, Receipt, TrendingUp } from "lucide-react";

const ReportsPage = () => {
  const { receipts } = useOrderStore();

  // 1. Filter for PAID receipts only
  const paidReceipts = receipts.filter((r) => r.status === "PAID");

  // 2. Calculate Metrics
  const totalCash = paidReceipts.reduce((sum, r) => sum + r.total, 0);
  const totalOrders = paidReceipts.length;
  const averageOrder = totalOrders > 0 ? totalCash / totalOrders : 0;

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto pt-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Session Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          A quick view of this session&apos;s completed sales.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Cash Collected */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Cash Collected
            </p>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Banknote size={20} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold text-foreground">
              {formatPrice(totalCash)}
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
              {formatPrice(averageOrder)}
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
