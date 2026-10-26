"use client";

import { Search, SlidersHorizontal, Loader2 } from "lucide-react";

import ReceiptPanel from "@/components/modules/receipt-panel";
import ProductCard from "@/components/modules/product-card";

import { useProducts } from "@/lib/hooks/product.hooks";

const CatalogPage = () => {
  const { data: products, isLoading, isError } = useProducts();

  return (
    <div className="flex h-full gap-6">
      {/* Left Side: Menu */}
      <div className="flex flex-1 flex-col gap-6 min-w-0">
        {/* Header Row */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Add items quickly
            </h1>
            <p className="text-sm text-muted-foreground">
              Tap an item to add it to the receipt.
            </p>
          </div>

          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>

        {/* Categories (static for now) */}
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

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="flex h-full items-center justify-center text-destructive">
              Error loading products. Is the backend running?
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Receipt Panel */}
      <ReceiptPanel />
    </div>
  );
};

export default CatalogPage;
