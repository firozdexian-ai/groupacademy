import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// --- Global CRM Type Defs ---
export interface TalentNode {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  verification_status: string;
  created_at: string;
}

export interface OutreachLog {
  id: string;
  talent_id: string;
  status: string;
  channel: string;
  sent_at: string;
}

export function useGlobalCRMGraph() {
  const queryClient = useQueryClient();

  // 1. The Master CRM Query
  const crmGraphQuery = useQuery({
    queryKey: ["global_crm_master"],
    queryFn: async () => {
      const [
        talentsRes,
        outreachRes,
        professionsRes
      ] = await Promise.all([
        // Fetch recent talents & exact platform count
        supabase.from("talents").select("id, user_id, full_name, email, phone, country, verification_status, created_at", { count: "exact" }).order("created_at", { ascending: false }).limit(300),
        // Fetch recent outreach & exact log count
        supabase.from("talent_outreach_log").select("id, talent_id, status, channel, sent_at", { count: "exact" }).order("sent_at", { ascending: false }).limit(300),
        // Fetch total professions count
        supabase.from("professional_roles").select("id", { count: "exact", head: true })
      ]);

      if (talentsRes.error) throw talentsRes.error;

      const recentTalents = (talentsRes.data || []) as TalentNode[];
      const totalTalents = talentsRes.count || 0;
      
      const recentOutreach = (outreachRes.data || []) as OutreachLog[];
      const totalOutreach = outreachRes.count || 0;
      
      const totalProfessions = professionsRes.count || 0;

      // KPI Math (MTD Calculations)
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const newTalentsThisMonth = recentTalents.filter(t => t.created_at >= firstDayOfMonth).length;

      return {
        recentTalents,
        totalTalents,
        newTalentsThisMonth,
        recentOutreach,
        totalOutreach,
        totalProfessions
      };
    }
  });

  // 2. Generic Invalidator for CRM Actions
  const invalidateCRM = () => {
    queryClient.invalidateQueries({ queryKey: ["global_crm_master"] });
    queryClient.invalidateQueries({ queryKey: ["talent-pool"] });
  };

  return {
    crmGraphQuery,
    invalidateCRM
  };
}
