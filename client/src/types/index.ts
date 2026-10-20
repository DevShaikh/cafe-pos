import type { AxiosResponse } from "axios";

export interface APIResponse<T> {
  success: boolean;
  message: string;
  code?: number;
  stack?: string;
  data: T;
}

export type ServiceResponse<T> = Promise<AxiosResponse<APIResponse<T>>>;
