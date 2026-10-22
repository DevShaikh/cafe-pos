import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/services/product.service";

export const productKeys = {
  all: ["products"] as const,
};

export const useProducts = () => {
  return useQuery({
    queryKey: productKeys.all,
    queryFn: async ({ signal }) => {
      const response = await getProducts(signal);
      return response.data.data;
    },
  });
};
