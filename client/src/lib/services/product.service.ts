import { Product } from "@/lib/schemas/product.schema";
import { apiClient } from "@/lib/services/api-client";
import { ServiceResponse } from "@/types";

const BASE_URL = "/products";
const CATEGORIES_URL = "/categories";

export type Category = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  name: string;
  description: string | null;
  pricePaisa: number;
  category: string;
};

export type ProductUpdate = Partial<ProductInput> & {
  isAvailable?: boolean;
};

export type ProductListParams = {
  search?: string;
  category?: string;
  includeUnavailable?: boolean;
};

/**
 * Fetches all products from the API.
 * @returns A service response containing the product list.
 */
export const getProducts = async (
  params: ProductListParams = {},
  signal?: AbortSignal,
): ServiceResponse<Product[]> => {
  return apiClient.get(`${BASE_URL}`, { params, signal });
};

export const getCategories = (
  signal?: AbortSignal,
): ServiceResponse<Category[]> => apiClient.get(CATEGORIES_URL, { signal });

export const createCategory = (
  name: string,
): ServiceResponse<Category> => apiClient.post(CATEGORIES_URL, { name });

export const updateCategory = (
  id: string,
  name: string,
): ServiceResponse<Category> =>
  apiClient.patch(`${CATEGORIES_URL}/${encodeURIComponent(id)}`, { name });

export const deleteCategory = (
  id: string,
): ServiceResponse<{ id: string }> =>
  apiClient.delete(`${CATEGORIES_URL}/${encodeURIComponent(id)}`);

export const createProduct = (
  input: ProductInput,
): ServiceResponse<Product> => apiClient.post(BASE_URL, input);

export const updateProduct = (
  id: string,
  input: ProductUpdate,
): ServiceResponse<Product> =>
  apiClient.patch(`${BASE_URL}/${encodeURIComponent(id)}`, input);

export const uploadProductImage = (
  id: string,
  image: File,
): ServiceResponse<Product> =>
  apiClient.post(`${BASE_URL}/${encodeURIComponent(id)}/image`, image, {
    headers: { "Content-Type": "application/octet-stream" },
  });

export const removeProductImage = (
  id: string,
): ServiceResponse<Product> =>
  apiClient.delete(`${BASE_URL}/${encodeURIComponent(id)}/image`);
