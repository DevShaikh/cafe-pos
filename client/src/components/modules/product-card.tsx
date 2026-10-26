import { Plus, Coffee } from "lucide-react";
import { useCartActions } from "@/store/cart.store";
import { formatPaisa } from "@/lib/utils";
import { Product } from "@/lib/schemas/product.schema";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addItem } = useCartActions();
  const formattedPrice = formatPaisa(product.pricePaisa);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
      {/* Image Placeholder */}
      <div className="relative flex aspect-4/3 w-full items-center justify-center bg-muted/30 transition-colors group-hover:bg-muted/50">
        <Coffee className="h-10 w-10 text-muted-foreground/40 transition-transform group-hover:scale-110" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h4 className="text-sm font-bold text-foreground leading-tight">
            {product.name}
          </h4>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {product.description || "No description"}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            {formattedPrice}
          </span>
          <button
            onClick={() =>
              addItem({
                id: product.id,
                name: product.name,
                pricePaisa: product.pricePaisa,
              })
            }
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground shadow-sm transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
