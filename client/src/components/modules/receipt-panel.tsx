"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import {
  CircleAlert,
  Receipt,
  CreditCard,
  Minus,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useCartStore, useCartActions } from "@/store/cart.store";
import { createUuid, formatPaisa, cn } from "@/lib/utils";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCreateOrder } from "@/lib/hooks/order.hooks";
import { useCurrentSession } from "@/lib/hooks/session.hooks";
import { useTaxSettings } from "@/lib/hooks/settings.hooks";
import { useReceiptPaperWidth } from "@/lib/receipt-paper-width";
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
    const key = createUuid();
    sessionStorage.setItem(
      PENDING_ORDER_KEY,
      JSON.stringify({ signature, key }),
    );
    return key;
  } catch {
    return createUuid();
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
  const currentSessionQuery = useCurrentSession();
  const taxSettingsQuery = useTaxSettings();
  const paperWidthMm = useReceiptPaperWidth();

  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [receiptToPrint, setReceiptToPrint] = useState<ReceiptType | null>(
    null,
  );
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState("");
  const [pendingInput, setPendingInput] = useState<{
    orderType: OrderType;
    items: { productId: string; quantity: number }[];
  } | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const finishPrint = useCallback(() => {
    setIsPrinting(false);
    setReceiptToPrint(null);
    setPrintError("");
  }, []);

  const failPrint = useCallback(() => {
    setIsPrinting(false);
    setPrintError(
      "The order was saved, but the receipt could not be printed. Try printing it again.",
    );
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${receiptToPrint?.receiptNumber || "New"}`,
    pageStyle: `@page { size: ${paperWidthMm}mm auto; margin: 0; }`,
    onAfterPrint: finishPrint,
    onPrintError: failPrint,
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

  const taxRateBps = taxSettingsQuery.data?.taxEnabled
    ? taxSettingsQuery.data.taxRateBps
    : 0;
  const taxPaisa = Math.round((subtotalPaisa * taxRateBps) / 10000);
  const totalPaisa = subtotalPaisa + taxPaisa;

  const handleGenerateReceipt = async () => {
    if (
      (!pendingInput && cartArray.length === 0) ||
      isPrinting ||
      !currentSessionQuery.data ||
      !taxSettingsQuery.data
    ) return;

    setIsPrinting(true);
    setPrintError("");
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

  const retryPrint = () => {
    if (!receiptToPrint) return;
    setPrintError("");
    setIsPrinting(true);
    handlePrint();
  };

  const checkoutError = createOrderMutation.error
    ? pendingInput
      ? "The server may have received this order. Retry without changing the cart to safely confirm it."
      : "Order was not created. Review the cart and try again."
    : null;
  return (
    <Card className="flex h-full w-100 shrink-0 flex-col overflow-hidden rounded-2xl p-0 shadow-sm">
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
          <Button
            type="button"
            onClick={() => setOrderType("DINE_IN")}
            disabled={isPrinting || !!pendingInput}
            aria-pressed={orderType === "DINE_IN"}
            variant={orderType === "DINE_IN" ? "secondary" : "ghost"}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              orderType === "DINE_IN" && "bg-background shadow-sm",
            )}
          >
            Dine in
          </Button>
          <Button
            type="button"
            onClick={() => setOrderType("TAKEAWAY")}
            disabled={isPrinting || !!pendingInput}
            aria-pressed={orderType === "TAKEAWAY"}
            variant={orderType === "TAKEAWAY" ? "secondary" : "ghost"}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
              orderType === "TAKEAWAY" && "bg-background shadow-sm",
            )}
          >
            Takeaway
          </Button>
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
                        <Button
                          type="button"
                          onClick={() => {
                            if (pendingInput) return;
                            if (item.quantity === 1) removeItem(item.id);
                            else updateQuantity(item.id, item.quantity - 1);
                          }}
                          disabled={!!pendingInput}
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Decrease ${item.name} quantity`}
                          className="rounded-md"
                        >
                          <Minus size={14} />
                        </Button>
                        <span className="w-6 text-center text-sm font-semibold text-foreground">
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={!!pendingInput}
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Increase ${item.name} quantity`}
                          className="rounded-md"
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={!!pendingInput}
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${item.name} from receipt`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
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
            <span>
              {taxSettingsQuery.isPending
                ? "Tax settings loading…"
                : taxRateBps > 0
                  ? `Tax (${(taxRateBps / 100).toFixed(2).replace(/\.?0+$/, "")}%)`
                  : "Tax (off)"}
            </span>
            <span>{formatPaisa(taxPaisa)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-lg font-bold text-foreground">
            <span>Total</span>
            <span>{formatPaisa(totalPaisa)}</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGenerateReceipt}
          disabled={
            (cartArray.length === 0 && !pendingInput) ||
            isPrinting ||
            !currentSessionQuery.data ||
            !taxSettingsQuery.data
          }
          size="lg"
          className="h-auto w-full rounded-xl px-4 py-4 text-base shadow-sm transition-transform active:scale-[0.98]"
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
        </Button>
        {checkoutError && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {checkoutError}
          </p>
        )}
        {taxSettingsQuery.isError && (
          <Alert variant="destructive" className="mt-3">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Cannot load tax settings</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Checkout is unavailable until the saved tax setting can be
                loaded.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => taxSettingsQuery.refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {printError && (
          <div
            role="alert"
            className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-destructive"
          >
            <p>{printError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPrinting}
              onClick={retryPrint}
            >
              Retry print
            </Button>
          </div>
        )}
        {currentSessionQuery.isLoading && (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            Checking cashier session…
          </p>
        )}
        {!currentSessionQuery.isLoading && currentSessionQuery.isError && (
          <Alert variant="destructive" className="mt-3">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Cannot verify cashier session</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>
                Checkout is unavailable until the register session can be
                checked.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => currentSessionQuery.refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {!currentSessionQuery.isLoading &&
          !currentSessionQuery.isError &&
          !currentSessionQuery.data && (
            <Alert className="mt-3 border-amber-500/40 bg-amber-500/5">
              <CircleAlert aria-hidden="true" />
              <AlertTitle>Cashier session required</AlertTitle>
              <AlertDescription>
                Open a cashier session with the “Open session” button in the
                top bar to enable checkout and receipt printing.
              </AlertDescription>
            </Alert>
        )}
      </div>

      {receiptToPrint && (
        <div className="hidden">
          <PrintReceipt
            ref={printRef}
            receipt={receiptToPrint}
            paperWidthMm={paperWidthMm}
          />
        </div>
      )}
    </Card>
  );
};

export default ReceiptPanel;
