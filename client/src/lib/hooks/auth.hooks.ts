import { useQuery } from "@tanstack/react-query";
import { getCurrentStaff } from "@/lib/services/auth.service";

export const authKeys = {
  session: ["auth", "session"] as const,
};

export const useCurrentStaff = () =>
  useQuery({
    queryKey: authKeys.session,
    queryFn: async ({ signal }) => {
      const response = await getCurrentStaff(signal);
      return response.data.data;
    },
    retry: false,
    staleTime: 30_000,
  });
