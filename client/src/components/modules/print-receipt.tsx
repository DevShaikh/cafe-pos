import { forwardRef } from "react";
import { Receipt } from "@/types";
import { formatPrice } from "@/lib/utils";

interface PrintReceiptProps {
  receipt: Receipt;
}

// We use forwardRef here because react-to-print needs a reference to this DOM node.
const PrintReceipt = forwardRef<HTMLDivElement, PrintReceiptProps>(
  ({ receipt }, ref) => {
    const date = new Date(receipt.createdAt).toLocaleString("en-PK", {
      dateStyle: "short",
      timeStyle: "short",
    });

    return (
      <div
        ref={ref}
        // 80mm is the standard width for thermal receipt printers
        className="w-[80mm] bg-white p-4 font-mono text-black"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-lg font-bold uppercase">Cafe POS</h1>
          <p className="text-xs">Counter Workspace</p>
          <p className="mt-2 text-xs font-bold">
            Receipt #{receipt.receiptNumber}
          </p>
        </div>

        {/* Metadata */}
        <div className="my-2 border-b border-dashed border-black pb-2 text-xs">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{date}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="uppercase">
              {receipt.orderType.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="mb-2 border-b border-dashed border-black pb-2 text-xs">
          {receipt.items.map((item, index) => {
            const itemPricePaisa = Math.round(item.price * 100);
            const lineTotalPaisa = itemPricePaisa * item.quantity;

            return (
              <div key={index} className="flex justify-between py-1">
                <div className="flex-1 pr-2">
                  <span className="mr-2 font-bold">{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span className="whitespace-nowrap">
                  {formatPrice(lineTotalPaisa)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPrice(receipt.subtotalPaisa)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (8%)</span>
            <span>{formatPrice(receipt.taxPaisa)}</span>
          </div>
          <div className="flex justify-between border-t border-dashed border-black pt-2 text-sm font-bold">
            <span>TOTAL</span>
            <span>{formatPrice(receipt.totalPaisa)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs">
          <p>Thank you for your visit!</p>
          <p className="mt-1">Please come again.</p>
        </div>
      </div>
    );
  },
);

PrintReceipt.displayName = "PrintReceipt";

export default PrintReceipt;
