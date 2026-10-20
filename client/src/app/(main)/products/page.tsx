import ProductsModule from "@/components/modules/products";

export const metadata = {
  title: "Products",
  description: "Products page of Cafe POS.",
};

const ProductPage = () => {
  return (
    <div>
      <ProductsModule />
    </div>
  );
};

export default ProductPage;
