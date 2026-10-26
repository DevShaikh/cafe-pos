import { CartItem } from "@/store/cart.store";
import type { AxiosResponse } from "axios";

//=======================================================
//  API Response Types
//=======================================================
export interface APIResponse<T> {
  success: boolean;
  message: string;
  code?: number;
  stack?: string;
  data: T;
}

export type ServiceResponse<T> = Promise<AxiosResponse<APIResponse<T>>>;

//=======================================================
//  Order Types
//=======================================================
export type OrderType = "DINE_IN" | "TAKEAWAY";

export type Receipt = {
  id: string;
  receiptNumber: number;
  items: CartItem[];
  subtotalPaisa: number;
  taxPaisa: number;
  totalPaisa: number;
  taxRateBps: number;
  orderType: OrderType;
  status: "PAID" | "UNPAID";
  createdAt: string;
  paidAt: string | null;
};

export type OrderStates = {
  receipts: Receipt[];
  nextReceiptNumber: number;
};
