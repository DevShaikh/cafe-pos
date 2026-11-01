import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getTaxSettings,
  updateTaxSettings,
  type UpdateTaxSettingsInput,
} from "@/lib/services/settings.service";

export const settingsKeys = {
  all: ["settings"] as const,
  tax: ["settings", "tax"] as const,
};

export function useTaxSettings() {
  return useQuery({
    queryKey: settingsKeys.tax,
    queryFn: async ({ signal }) =>
      (await getTaxSettings(signal)).data.data,
  });
}

export function useUpdateTaxSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaxSettingsInput) =>
      updateTaxSettings(input).then((response) => response.data.data),
    onSuccess: (settings) =>
      queryClient.setQueryData(settingsKeys.tax, settings),
  });
}
