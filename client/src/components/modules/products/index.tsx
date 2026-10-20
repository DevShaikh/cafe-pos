"use client";

import { useProducts } from "@/hooks/product.hooks";

const ProductsModule = () => {
  const { data: products, isPending, isError, error } = useProducts();

  if (isPending) return <p>Loading products...</p>;

  if (isError) {
    return <p>Unable to load products: {error.message}</p>;
  }

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>
          {product.name} — Rs. {product.price}
        </li>
      ))}
    </ul>
  );
};

export default ProductsModule;
