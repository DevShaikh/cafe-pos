import { Product } from "@/lib/schemas/product.schema";
import { apiClient } from "@/lib/services/api-client";
import { ServiceResponse } from "@/types";

const BASE_URL = "/products";

/**
 * @description Fetches the user's XP balance.
 * @returns A service response containing the user's XP balance.
 */
export const getProducts = async (
  signal?: AbortSignal,
): ServiceResponse<Product[]> => {
  return apiClient.get(`${BASE_URL}`, { signal });
};
