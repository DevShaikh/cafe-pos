import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/services/product.service";

export const productKeys = {
  all: ["products"] as const,
};

/**
 * @description Custom hook to fetch products.
 * @returns A query object containing the products data and status.
 */
export const useProducts = () => {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: async ({ signal }) => {
      const res = await getProducts(signal);
      return res.data.data;
    },
  });
};
