import { useQuery } from "@tanstack/react-query";
import { getApplicationBuckets } from "@/domains/jobs/repo/jobsRepo";
import { useAuth } from "@/hooks/useAuth";

/**
 * GroUp Academy: Application Metrics Orchestrator
 * CTO Reference: Authoritative sensor for user application status buckets.
 * Logic: Synchronizes dashboard counters with real-time application states.
 * Architecture: Digital Workforce sensor enabled for RPC anomaly detection.
 */

export interface ApplicationBuckets {
  active: number;
  action_needed: number;
  closed: number;
}

export function useApplicationBuckets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["application-buckets", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<ApplicationBuckets> => {
      if (!user?.id) return { active: 0, action_needed: 0, closed: 0 };

      // HUD: EXECUTING_RPC_HANDSHAKE
      try {
        const data = await getApplicationBuckets(user.id);
        return ((data as unknown) as ApplicationBuckets) || { active: 0, action_needed: 0, closed: 0 };
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: get_application_buckets failed sync.", {
          userId: user.id,
          error: error?.message,
          code: error?.code,
        });
        return { active: 0, action_needed: 0, closed: 0 };
      }
    },
    // Performance: Sustained legibility for 60s to prevent rapid DB polling
    staleTime: 60_000,
  });
}
