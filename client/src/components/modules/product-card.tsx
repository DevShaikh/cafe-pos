import { Plus } from "lucide-react";

import { useCartActions } from "@/store/cart.store";
import { Product } from "@/lib/schemas/product.schema";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCartActions();

  return (
    <div className="group relative flex flex-col rounded-2xl border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
      {/* Image Placeholder */}
      <div className="mb-3 flex aspect-4/3 w-full items-center justify-center rounded-xl bg-muted text-muted-foreground/30">
        <span className="text-xs font-medium">No Image</span>
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-foreground leading-tight">
            {product.name}
          </h4>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {product.description || "No description"}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            {formatPrice(parseFloat(product.price))}
          </span>
          <button
            onClick={() =>
              addItem({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
              })
            }
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
