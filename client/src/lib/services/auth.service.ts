import { apiClient } from "@/lib/services/api-client";
import type { ServiceResponse } from "@/types";

export type StaffOption = {
  id: string;
  name: string;
};

export type StaffSession = StaffOption & {
  role: "ADMIN" | "MANAGER" | "CASHIER";
};

export type LoginInput = {
  staffId: string;
  pin: string;
};

export const getActiveStaff = (signal?: AbortSignal) =>
  apiClient.get<{
    success: boolean;
    message: string;
    data: StaffOption[];
  }>("/auth/staff", { signal });

export const login = (input: LoginInput) =>
  apiClient.post<{
    success: boolean;
    message: string;
    data: StaffSession;
  }>("/auth/login", input);

export const getCurrentStaff = (signal?: AbortSignal) =>
  apiClient.get<{
    success: boolean;
    message: string;
    data: StaffSession;
  }>("/auth/me", { signal });

export const logout = (): ServiceResponse<null> =>
  apiClient.post("/auth/logout");
