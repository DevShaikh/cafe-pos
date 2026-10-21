import { Product } from "@/lib/schemas/product.schema";
import { apiClient } from "@/lib/services/api-client";
import { ServiceResponse } from "@/types";

const BASE_URL = "/products";

/**
 * Fetches all products from the API.
 * @returns A service response containing the product list.
 */
export const getProducts = async (
  signal?: AbortSignal,
): ServiceResponse<Product[]> => {
  return apiClient.get(`${BASE_URL}`, { signal });
};
