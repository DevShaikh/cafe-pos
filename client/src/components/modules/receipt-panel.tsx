"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Receipt,
  CreditCard,
  Minus,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useCartStore, useCartActions } from "@/store/cart.store";
import { formatPaisa, cn } from "@/lib/utils";
import { useCreateOrder } from "@/lib/hooks/order.hooks";
import { toReceipt } from "@/lib/services/order.service";
import PrintReceipt from "./print-receipt";
import { Receipt as ReceiptType, OrderType } from "@/types";

const PENDING_ORDER_KEY = "cafe-pos-pending-order";

function getIdempotencyKey(signature: string) {
  try {
    const saved = sessionStorage.getItem(PENDING_ORDER_KEY);
    if (saved) {
      const pending = JSON.parse(saved) as { signature?: string; key?: string };
      if (pending.signature === signature && pending.key) return pending.key;
    }
    const key = crypto.randomUUID();
    sessionStorage.setItem(
      PENDING_ORDER_KEY,
      JSON.stringify({ signature, key }),
    );
    return key;
  } catch {
    return crypto.randomUUID();
  }
}

function clearPendingOrderKey() {
  try {
    sessionStorage.removeItem(PENDING_ORDER_KEY);
  } catch {
    // The in-memory key still protects retries during this page session.
  }
}

const ReceiptPanel = () => {
  const { cartItems } = useCartStore();
  const { updateQuantity, removeItem, clearCartStore } = useCartActions();
  const createOrderMutation = useCreateOrder();

  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [receiptToPrint, setReceiptToPrint] = useState<ReceiptType | null>(
    null,
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const [pendingInput, setPendingInput] = useState<{
    orderType: OrderType;
    items: { productId: string; quantity: number }[];
  } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${receiptToPrint?.receiptNumber || "New"}`,
    onAfterPrint: () => {
      setIsPrinting(false);
      setReceiptToPrint(null);
    },
    onPrintError: () => {
      setIsPrinting(false);
      setReceiptToPrint(null);
    },
  });

  useEffect(() => {
    if (receiptToPrint) {
      handlePrint();
    }
  }, [receiptToPrint, handlePrint]);

  const cartArray = Object.values(cartItems);

  const subtotalPaisa = cartArray.reduce((sum, item) => {
    return sum + item.pricePaisa * item.quantity;
  }, 0);

  const taxRateBps = 800;
  const taxPaisa = Math.round((subtotalPaisa * taxRateBps) / 10000);
  const totalPaisa = subtotalPaisa + taxPaisa;

  const handleGenerateReceipt = async () => {
    if ((!pendingInput && cartArray.length === 0) || isPrinting) return;

    setIsPrinting(true);
    try {
      const input = pendingInput ?? {
        orderType,
        items: cartArray.map(({ id, quantity }) => ({
          productId: id,
          quantity,
        })),
      };
      setPendingInput(input);
      const signature = JSON.stringify(input);
      const key = pendingKey ?? getIdempotencyKey(signature);
      setPendingKey(key);
      const order = await createOrderMutation.mutateAsync({
        input,
        idempotencyKey: key,
      });
      clearPendingOrderKey();
      setPendingInput(null);
      setPendingKey(null);
      setReceiptToPrint(toReceipt(order));
      clearCartStore();
      setOrderType("DINE_IN");
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status !== undefined && status < 500) {
        clearPendingOrderKey();
        setPendingInput(null);
        setPendingKey(null);
      }
    } finally {
      setIsPrinting(false);
    }
  };

  const checkoutError = createOrderMutation.error
    ? pendingInput
      ? "The server may have received this order. Retry without changing the cart to safely confirm it."
      : "Order was not created. Review the cart and try again."
    : null;

  return (
    <div className="flex h-full w-100 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
            disabled={isPrinting || !!pendingInput}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all disabled:opacity-50",
              orderType === "DINE_IN"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Dine in
          </button>
          <button
            onClick={() => setOrderType("TAKEAWAY")}
            disabled={isPrinting || !!pendingInput}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all disabled:opacity-50",
              orderType === "TAKEAWAY"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Takeaway
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {cartArray.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {isPrinting ? "Generating receipt..." : "Cart is empty"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isPrinting
                ? "Please wait for the print dialog."
                : "Tap items from the menu to add them to the receipt."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartArray.map((item) => {
              const lineTotalPaisa = item.pricePaisa * item.quantity;
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
                          {formatPaisa(item.pricePaisa)} each
                        </p>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {formatPaisa(lineTotalPaisa)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                        <button
                          onClick={() => {
                            if (pendingInput) return;
                            if (item.quantity === 1) removeItem(item.id);
                            else updateQuantity(item.id, item.quantity - 1);
                          }}
                          disabled={!!pendingInput}
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
                          disabled={!!pendingInput}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={!!pendingInput}
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

      <div className="border-t border-border bg-muted/30 p-6">
        <div className="mb-6 space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPaisa(subtotalPaisa)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax (8%)</span>
            <span>{formatPaisa(taxPaisa)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-lg font-bold text-foreground">
            <span>Total</span>
            <span>{formatPaisa(totalPaisa)}</span>
          </div>
        </div>

        <button
          onClick={handleGenerateReceipt}
          disabled={(cartArray.length === 0 && !pendingInput) || isPrinting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPrinting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Saving order...
            </>
          ) : (
            <>
              <CreditCard size={20} />
              {pendingInput ? "Retry order" : "Generate & Print receipt"}
            </>
          )}
        </button>
        {checkoutError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {checkoutError}
          </p>
        )}
      </div>

      {receiptToPrint && (
        <div className="hidden">
          <PrintReceipt ref={printRef} receipt={receiptToPrint} />
        </div>
      )}
    </div>
  );
};

export default ReceiptPanel;
