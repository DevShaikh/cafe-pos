import { apiClient } from "@/lib/services/api-client";
import type { RegisterSession, ServiceResponse } from "@/types";

export const getCurrentSession = (signal?: AbortSignal): ServiceResponse<RegisterSession | null> =>
  apiClient.get("/sessions/current", { signal });

export const getSessions = (signal?: AbortSignal): ServiceResponse<RegisterSession[]> =>
  apiClient.get("/sessions?limit=100", { signal });

export const openSession = (idempotencyKey: string): ServiceResponse<RegisterSession> =>
  apiClient.post("/sessions", {}, { headers: { "Idempotency-Key": idempotencyKey } });

export const closeSession = (
  sessionId: string,
  idempotencyKey: string,
): ServiceResponse<RegisterSession> =>
  apiClient.post(
    `/sessions/${encodeURIComponent(sessionId)}/close`,
    {},
    { headers: { "Idempotency-Key": idempotencyKey } },
  );
