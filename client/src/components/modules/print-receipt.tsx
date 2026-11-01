import { forwardRef } from "react";
import { Receipt } from "@/types";
import { formatPaisa } from "@/lib/utils";
import type { ReceiptPaperWidth } from "@/lib/receipt-paper-width";

interface PrintReceiptProps {
  receipt: Receipt;
  paperWidthMm: ReceiptPaperWidth;
}

const PrintReceipt = forwardRef<HTMLDivElement, PrintReceiptProps>(
  ({ receipt, paperWidthMm }, ref) => {
    const date = new Date(receipt.createdAt).toLocaleString("en-PK", {
      dateStyle: "short",
      timeStyle: "short",
    });

    return (
      <div
        ref={ref}
        className={`bg-white font-mono text-black ${
          paperWidthMm === 58 ? "w-[58mm] px-2 py-3" : "w-[80mm] p-4"
        }`}
      >
        <div className="text-center">
          <h1 className="text-lg font-bold uppercase">Cafe POS</h1>
          <p className="text-xs">Counter Workspace</p>
          <p className="mt-2 text-xs font-bold">
            Receipt #{receipt.receiptNumber}
          </p>
        </div>

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

        <div className="mb-2 border-b border-dashed border-black pb-2 text-xs">
          {receipt.items.map((item, index) => {
            const lineTotalPaisa = item.pricePaisa * item.quantity;
            return (
              <div key={index} className="flex justify-between py-1">
                <div className="flex-1 pr-2">
                  <span className="mr-2 font-bold">{item.quantity}x</span>
                  <span>{item.name}</span>
                </div>
                <span className="whitespace-nowrap">
                  {formatPaisa(lineTotalPaisa)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPaisa(receipt.subtotalPaisa)}</span>
          </div>
          {receipt.taxRateBps > 0 && (
            <div className="flex justify-between">
              <span>
                Tax ({(receipt.taxRateBps / 100).toFixed(2).replace(/\.?0+$/, "")}%)
              </span>
              <span>{formatPaisa(receipt.taxPaisa)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-dashed border-black pt-2 text-sm font-bold">
            <span>TOTAL</span>
            <span>{formatPaisa(receipt.totalPaisa)}</span>
          </div>
        </div>

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
