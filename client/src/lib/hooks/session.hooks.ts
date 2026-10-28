import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  closeSession,
  getCurrentSession,
  getSessions,
  openSession,
} from "@/lib/services/session.service";

export const sessionKeys = {
  current: ["sessions", "current"] as const,
  all: ["sessions"] as const,
};

export function useCurrentSession() {
  return useQuery({
    queryKey: sessionKeys.current,
    queryFn: async ({ signal }) => (await getCurrentSession(signal)).data.data,
    staleTime: 30_000,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: async ({ signal }) => (await getSessions(signal)).data.data,
  });
}

function useRefreshSessions() {
  const queryClient = useQueryClient();
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: sessionKeys.current }),
    queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
    queryClient.invalidateQueries({ queryKey: ["orders"] }),
    queryClient.invalidateQueries({ queryKey: ["reports"] }),
  ]);
}

export function useOpenSession() {
  const refresh = useRefreshSessions();
  return useMutation({
    mutationFn: (idempotencyKey: string) =>
      openSession(idempotencyKey).then((response) => response.data.data),
    onSettled: refresh,
  });
}

export function useCloseSession() {
  const refresh = useRefreshSessions();
  return useMutation({
    mutationFn: ({ sessionId, idempotencyKey }: { sessionId: string; idempotencyKey: string }) =>
      closeSession(sessionId, idempotencyKey).then((response) => response.data.data),
    onSettled: refresh,
  });
}
