import ProductsModule from "@/components/modules/products";

export const metadata = {
  title: "Products | Cafe POS",
  description: "Products page of the Cafe POS system",
};

const ProductPage = () => {
  return (
    <div>
      <ProductsModule />
    </div>
  );
};

export default ProductPage;
