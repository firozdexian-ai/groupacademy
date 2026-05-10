import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type PipelineStage =
  | "target"
  | "warm_intro"
  | "first_meeting"
  | "partner_pitch"
  | "deep_diligence"
  | "term_sheet"
  | "closed"
  | "passed";

export type LeadCapability = "lead" | "co_lead" | "follower" | "syndicate" | "angel";

export interface PipelineInvestor {
  id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  vc_firm_id: string | null;
  pipeline_stage: PipelineStage;
  pipeline_position: number;
  lead_capability: LeadCapability;
  check_size_min_usd: number | null;
  check_size_max_usd: number | null;
  probability_pct: number;
  expected_close_date: string | null;
  stage_changed_at: string;
  last_contacted_at: string | null;
  vc_firm?: { id: string; name: string; logo_url: string | null } | null;
}

const PIPELINE_QUERY_KEY = ["ir-pipeline-investors"] as const;

export function useIRPipeline() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: PIPELINE_QUERY_KEY,
    queryFn: async (): Promise<PipelineInvestor[]> => {
      const { data, error } = await (supabase as any)
        .from("ir_investors")
        .select(
          `id, full_name, title, email, vc_firm_id, pipeline_stage, pipeline_position,
           lead_capability, check_size_min_usd, check_size_max_usd, probability_pct,
           expected_close_date, stage_changed_at, last_contacted_at,
           vc_firm:ir_vc_firms(id, name, logo_url)`,
        )
        .order("pipeline_position", { ascending: true })
        .order("stage_changed_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PipelineInvestor[];
    },
  });

  const moveCard = useMutation({
    mutationFn: async (params: {
      investorId: string;
      toStage: PipelineStage;
      toPosition: number;
    }) => {
      const { error } = await (supabase as any)
        .from("ir_investors")
        .update({
          pipeline_stage: params.toStage,
          pipeline_position: params.toPosition,
        })
        .eq("id", params.investorId);
      if (error) throw error;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: PIPELINE_QUERY_KEY });
      const prev = qc.getQueryData<PipelineInvestor[]>(PIPELINE_QUERY_KEY);
      if (prev) {
        qc.setQueryData<PipelineInvestor[]>(
          PIPELINE_QUERY_KEY,
          prev.map((inv) =>
            inv.id === vars.investorId
              ? {
                  ...inv,
                  pipeline_stage: vars.toStage,
                  pipeline_position: vars.toPosition,
                  stage_changed_at: new Date().toISOString(),
                }
              : inv,
          ),
        );
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(PIPELINE_QUERY_KEY, ctx.prev);
      toast({
        title: "Move failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PIPELINE_QUERY_KEY });
    },
  });

  const updateInvestor = useMutation({
    mutationFn: async (params: {
      investorId: string;
      patch: Partial<
        Pick<
          PipelineInvestor,
          | "lead_capability"
          | "check_size_min_usd"
          | "check_size_max_usd"
          | "probability_pct"
          | "expected_close_date"
        >
      >;
    }) => {
      const { error } = await (supabase as any)
        .from("ir_investors")
        .update(params.patch)
        .eq("id", params.investorId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PIPELINE_QUERY_KEY });
      toast({ title: "Investor updated" });
    },
    onError: (err) => {
      toast({
        title: "Update failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    },
  });

  return { ...query, moveCard, updateInvestor };
}
