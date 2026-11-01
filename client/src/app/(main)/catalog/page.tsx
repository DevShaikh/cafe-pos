"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";

import ReceiptPanel from "@/components/modules/receipt-panel";
import ProductCard from "@/components/modules/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts } from "@/lib/hooks/product.hooks";

const CatalogPage = () => {
  const { data: products, isLoading, isError } = useProducts({
    includeUnavailable: true,
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All items");
  const [showUnavailable, setShowUnavailable] = useState(true);
  const categories = useMemo(
    () => [...new Set((products ?? []).map((product) => product.category))].sort(),
    [products],
  );
  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return (products ?? []).filter(
      (product) =>
        (category === "All items" || product.category === category) &&
        (!searchTerm || product.name.toLowerCase().includes(searchTerm)) &&
        (showUnavailable || product.isAvailable),
    );
  }, [category, products, search, showUnavailable]);

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
            <Input
              type="search"
              aria-label="Search menu"
              placeholder="Search menu..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-xl pl-9 pr-4"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            type="button"
            size="sm"
            variant={category === "All items" ? "default" : "outline"}
            aria-pressed={category === "All items"}
            onClick={() => setCategory("All items")}
          >
            All items
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              type="button"
              size="sm"
              variant={category === cat ? "default" : "outline"}
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="ml-auto shrink-0"
            aria-label={
              showUnavailable
                ? "Hide unavailable products"
                : "Show unavailable products"
            }
            aria-pressed={showUnavailable}
            title={
              showUnavailable
                ? "Hide unavailable products"
                : "Show unavailable products"
            }
            onClick={() => setShowUnavailable((visible) => !visible)}
          >
            <SlidersHorizontal size={16} />
          </Button>
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
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No products match these filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
              {filteredProducts.map((product) => (
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
