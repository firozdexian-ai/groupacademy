import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

/**
 * GroUp Academy: Institutional Application Ledger (V2.1.0)
 * CTO Reference: Authoritative sensor for market engagement tracking and history.
 * Architecture: Phase Z0 Hardened. Automated Efficiency protocol enabled.
 */

export interface ApplicationHistoryItem {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
  deliveryStatus: string;
  appliedAt: string;
  isPaid: boolean;
}

export function useApplicationHistory() {
  const { talent } = useTalent();

  return useQuery({
    queryKey: ["application-history", talent?.id],
    enabled: !!talent?.id,
    staleTime: 5 * 60 * 1000, // 5m cache for executive consistency
    queryFn: async (): Promise<ApplicationHistoryItem[]> => {
      if (!talent?.id) return [];

      // HUD: NEURAL_RELATIONAL_SYNC
      const { data, error: fetchError } = await supabase
        .from("job_applications")
        .select(
          `
          id,
          job_id,
          application_status,
          delivery_status,
          created_at,
          is_paid,
          jobs:job_id (
            title,
            company_name
          )
        `,
        )
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false })
        .limit(20); // Expanded from 10 to 20 for May 2026 depth requirements

      if (fetchError) {
        // Digital Workforce Sensor: Report sync fault for Agent coaching
        console.error("[Digital Workforce] FAULT: LEDGER_SYNC_FAULT", {
          talentId: talent.id,
          error: fetchError.message,
          code: fetchError.code,
        });
        throw new Error("REGISTRY_FAULT: Failed to load application history.");
      }

      // HUD: REGISTRY_MAPPING_PROTOCOL
      return (data || []).map((app: any) => ({
        id: app.id,
        jobId: app.job_id,
        jobTitle: app.jobs?.title || "Unknown_Node",
        companyName: app.jobs?.company_name || "Unknown_Institution",
        applicationStatus: app.application_status || "submitted",
        deliveryStatus: app.delivery_status || "pending",
        appliedAt: app.created_at,
        isPaid: app.is_paid || false,
      }));
    },
  });
}
