import { Receipt, CreditCard, Minus, Plus, Trash2 } from "lucide-react";

const ReceiptPanel = () => {
  return (
    <div className="flex h-full w-100 shrink-0 flex-col rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
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

        {/* Dine in / Takeaway Toggle */}
        <div className="flex items-center gap-1 rounded-xl bg-muted p-1">
          <button className="flex-1 rounded-lg bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm">
            Dine in
          </button>
          <button className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Takeaway
          </button>
        </div>
      </div>

      {/* Cart Items Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 
          Empty State: Uncomment this if you want to see the empty cart.
          Currently showing dummy items to demonstrate the design.
        */}
        {/* 
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Receipt className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Cart is empty</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap items from the menu to add them to the receipt.
          </p>
        </div> 
        */}

        {/* Dummy Cart Items (for visual structure) */}
        <div className="space-y-4">
          {/* Item 1 */}
          <div className="flex gap-3">
            {/* Image Placeholder */}
            <div className="h-16 w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Receipt size={20} />
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Flat white
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    PKR 450.00 each
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground">PKR 450.00</p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                  <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-foreground">
                    1
                  </span>
                  <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Plus size={14} />
                  </button>
                </div>
                <button className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-4" />

          {/* Item 2 */}
          <div className="flex gap-3">
            <div className="h-16 w-16 shrink-0 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Receipt size={20} />
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Avocado toast
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    PKR 890.00 each
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground">PKR 890.00</p>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                  <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-foreground">
                    1
                  </span>
                  <button className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Plus size={14} />
                  </button>
                </div>
                <button className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Totals & Checkout Action */}
      <div className="border-t border-border bg-muted/30 p-6">
        <div className="mb-6 space-y-3 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>PKR 1,340.00</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Tax (8%)</span>
            <span>PKR 107.20</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3 font-bold text-foreground text-lg">
            <span>Total</span>
            <span>PKR 1,447.20</span>
          </div>
        </div>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]">
          <CreditCard size={20} />
          Generate receipt
        </button>
      </div>
    </div>
  );
};

export default ReceiptPanel;
