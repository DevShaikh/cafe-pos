import { apiClient } from "@/lib/services/api-client";
import type { ServiceResponse } from "@/types";

export type TaxSettings = {
  taxEnabled: boolean;
  taxRateBps: number;
  updatedAt: string;
};

export type UpdateTaxSettingsInput = Pick<
  TaxSettings,
  "taxEnabled" | "taxRateBps"
>;

export const getTaxSettings = (
  signal?: AbortSignal,
): ServiceResponse<TaxSettings> => apiClient.get("/settings/tax", { signal });

export const updateTaxSettings = (
  input: UpdateTaxSettingsInput,
): ServiceResponse<TaxSettings> => apiClient.patch("/settings/tax", input);
