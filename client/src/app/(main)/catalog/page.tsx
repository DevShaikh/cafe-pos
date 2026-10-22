import { Search, SlidersHorizontal } from "lucide-react";
import ReceiptPanel from "@/components/modules/receipt-panel";

const CatalogPage = () => {
  return (
    <div className="flex h-full w-full gap-6">
      {/* Left Side: Menu & Categories */}
      <div className="flex flex-1 flex-col gap-6 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Add items quickly
            </h3>
            <p className="text-sm text-muted-foreground">
              Tap an item to add it to the receipt.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu"
              className="w-full rounded-xl border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">
            All items
          </button>
          {["Tea & Beverages", "Breakfast", "Lunch", "Pastries"].map((cat) => (
            <button
              key={cat}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {cat}
            </button>
          ))}
          <button className="ml-auto rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted">
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Product Grid Placeholder */}
        <div className="flex-1 rounded-2xl border-2 border-dashed border-border bg-card/50 flex items-center justify-center">
          <p className="text-sm font-medium text-muted-foreground">
            Product Grid will be wired up in Step 3
          </p>
        </div>
      </div>

      {/* Right Side: Receipt Workspace */}
      <ReceiptPanel />
    </div>
  );
};

export default CatalogPage;
