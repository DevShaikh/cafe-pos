"use client";

import { useState } from "react";
import { Receipt, CreditCard, Minus, Plus, Trash2 } from "lucide-react";
import { useCartActions, useCartStore } from "@/store/cart.store";
import { useOrderActions } from "@/store/order.store";

import { cn, formatPKR } from "@/lib/utils";
import { OrderType } from "@/types";

const ReceiptPanel = () => {
  const { cartItems } = useCartStore();

  const { updateQuantity, removeItem, clearCartStore } = useCartActions();
  const { addReceipt } = useOrderActions();

  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");

  const cartArray = Object.values(cartItems);

  const subtotalPaisa = cartArray.reduce((sum, item) => {
    return sum + Math.round(item.price * 100) * item.quantity;
  }, 0);
  const taxPaisa = Math.round(subtotalPaisa * 0.08);
  const totalPaisa = subtotalPaisa + taxPaisa;

  const handleGenerateReceipt = () => {
    if (cartArray.length === 0) return;

    addReceipt({
      items: cartArray,
      subtotalPaisa,
      taxPaisa,
      totalPaisa,
      orderType,
    });

    clearCartStore();
    setOrderType("DINE_IN"); // Reset toggle
  };

  return (
    <div className="flex h-full w-100 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Header & Order Type Toggle */}
      <div className="border-b border-border p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Receipt Workspace
            </p>
            <h2 className="text-xl font-bold text-foreground">New receipt</h2>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
          <button
            onClick={() => setOrderType("DINE_IN")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              orderType === "DINE_IN"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Dine in
          </button>
          <button
            onClick={() => setOrderType("TAKEAWAY")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              orderType === "TAKEAWAY"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Takeaway
          </button>
        </div>
      </div>

      {/* Cart Items Area (Keep as is) */}
      <div className="flex-1 overflow-y-auto p-6">
        {cartArray.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Cart is empty</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap items from the menu to add them to the receipt.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartArray.map((item) => {
              const itemPricePaisa = Math.round(item.price * 100);
              const lineTotalPaisa = itemPricePaisa * item.quantity;
              return (
                <div key={item.id} className="flex gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Receipt size={20} />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {formatPKR(itemPricePaisa)} each
                        </p>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {formatPKR(lineTotalPaisa)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                        <button
                          onClick={() => {
                            if (item.quantity === 1) removeItem(item.id);
                            else updateQuantity(item.id, item.quantity - 1);
                          }}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer (Keep as is) */}
      <div className="border-t border-border bg-muted/30 p-6">
        <div className="mb-6 space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPKR(subtotalPaisa)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax (8%)</span>
            <span>{formatPKR(taxPaisa)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-lg font-bold text-foreground">
            <span>Total</span>
            <span>{formatPKR(totalPaisa)}</span>
          </div>
        </div>

        <button
          onClick={handleGenerateReceipt}
          disabled={cartArray.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          <CreditCard size={20} />
          Generate receipt
        </button>
      </div>
    </div>
  );
};

export default ReceiptPanel;
