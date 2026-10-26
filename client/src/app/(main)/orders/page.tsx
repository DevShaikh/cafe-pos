"use client";

import { useOrderStore, useOrderActions } from "@/store/order.store";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, Receipt as ReceiptIcon, Clock } from "lucide-react";

const OrdersPage = () => {
  const { receipts } = useOrderStore();
  const { markAsPaid } = useOrderActions();

  const unpaidReceipts = receipts.filter((r) => r.status === "UNPAID");
  const paidReceipts = receipts.filter((r) => r.status === "PAID");

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Orders & Payments
        </h2>
        <p className="text-sm text-muted-foreground">
          Mark receipts as paid when the waiter returns with cash.
        </p>
      </div>

      {/* Unpaid Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Unpaid Orders</h3>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {unpaidReceipts.length} pending
          </span>
        </div>

        {unpaidReceipts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            No unpaid receipts right now.
          </div>
        ) : (
          <div className="grid gap-4">
            {unpaidReceipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <ReceiptIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-foreground">
                        #{receipt.receiptNumber}
                      </h4>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize">
                        {receipt.orderType.replace("_", " ").toLowerCase()}
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Clock size={14} />
                      {new Date(receipt.createdAt).toLocaleTimeString("en-PK", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Cash due</p>
                    <p className="text-lg font-bold text-foreground">
                      {formatPrice(receipt.total)}
                    </p>
                  </div>
                  <button
                    onClick={() => markAsPaid(receipt.id)}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
                  >
                    <CheckCircle2 size={18} />
                    Mark as paid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paid Section */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-muted-foreground">
            Paid Today
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {paidReceipts.length} paid
          </span>
        </div>

        {paidReceipts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No completed payments yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Receipt</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Paid At</th>
                  <th className="px-6 py-4 font-medium text-right">Total</th>
                  <th className="px-6 py-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paidReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium text-foreground">
                      #{receipt.receiptNumber}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground capitalize">
                      {receipt.orderType.replace("_", " ").toLowerCase()}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {receipt.paidAt
                        ? new Date(receipt.paidAt).toLocaleTimeString("en-PK", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-foreground">
                      {formatPrice(receipt.total)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-semibold text-green-600 dark:text-green-400">
                        <CheckCircle2 size={12} />
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
