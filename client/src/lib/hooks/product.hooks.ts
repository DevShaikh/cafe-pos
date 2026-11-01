import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCategory,
  createProduct,
  deleteCategory,
  getCategories,
  getProducts,
  updateCategory,
  updateProduct,
  type Category,
  type ProductListParams,
  type ProductInput,
  type ProductUpdate,
} from "@/lib/services/product.service";

export const productKeys = {
  all: ["products"] as const,
  categories: ["categories"] as const,
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

export const useCategories = () =>
  useQuery({
    queryKey: productKeys.categories,
    queryFn: async ({ signal }) =>
      (await getCategories(signal)).data.data,
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput) =>
      createProduct(input).then((response) => response.data.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductUpdate }) =>
      updateProduct(id, input).then((response) => response.data.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      createCategory(name).then((response) => response.data.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.categories }),
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateCategory(id, name).then((response) => response.data.data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.categories }),
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
      ]);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: Category["id"]) =>
      deleteCategory(id).then((response) => response.data.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: productKeys.categories }),
  });
};
