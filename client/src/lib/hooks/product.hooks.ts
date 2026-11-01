import { useQuery } from "@tanstack/react-query";
import {
  getProducts,
  type ProductListParams,
} from "@/lib/services/product.service";

export const productKeys = {
  all: ["products"] as const,
};

export const useProducts = (params: ProductListParams = {}) => {
  return useQuery({
    queryKey: [...productKeys.all, params],
    queryFn: async ({ signal }) => {
      const response = await getProducts(params, signal);
      return response.data.data;
    },
  });
};
