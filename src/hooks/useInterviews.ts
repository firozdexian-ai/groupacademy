import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyHiringEvent } from "@/domains/jobs/api/jobsApi";
import { insertInterview, insertInterviewSlots } from "@/domains/jobs/repo/jobsRepo";

/**
 * GroUp Academy: Hiring Workflow & Interview Orchestrator (V5.6.0)
 * CTO Reference: Authoritative system for scheduling, slot confirmation, and offer tracking.
 * Architecture: Digital Workforce enabled - logs scheduling bottlenecks to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

export type InterviewMode = "video" | "phone" | "onsite";
export type InterviewStatus = "proposed" | "confirmed" | "rescheduled" | "completed" | "no_show" | "cancelled";

export interface InterviewSlot {
  id: string;
  interview_id: string;
  starts_at: string;
  duration_min: number;
  proposed_by_role: string;
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  company_id: string;
  talent_id: string;
  mode: InterviewMode;
  meeting_link: string | null;
  location: string | null;
  note: string | null;
  status: InterviewStatus;
  selected_slot_id: string | null;
  duration_min: number;
  created_at: string;
  updated_at: string;
}

export interface HireState {
  interview: (Interview & { slots: InterviewSlot[] }) | null;
  offer: any | null;
}

// --- SENSOR: APPLICATION_HIRE_STATE ---
export function useApplicationHireState(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["application-hire-state", applicationId],
    enabled: !!applicationId,
    staleTime: 1000 * 60, // 1-minute consistency for active scheduling
    queryFn: async (): Promise<HireState> => {
      // HUD: EXECUTING_RPC_HIRE_STATE_SYNC
      const { data, error } = await supabase.rpc("get_application_hire_state", {
        p_application_id: applicationId,
      });

      if (error) {
        console.error("[Digital Workforce] FAULT: get_application_hire_state query failed.", error);
        throw error;
      }
      return (data as any) ?? { interview: null, offer: null };
    },
  });
}

// --- ACTION: CREATE_INTERVIEW_ORCHESTRATION ---
export function useCreateInterview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      application_id: string;
      company_id: string;
      talent_id: string;
      mode: InterviewMode;
      meeting_link?: string;
      location?: string;
      note?: string;
      duration_min: number;
      slots: string[]; // ISO timestamps
    }) => {
      const { data: u } = await supabase.auth.getUser();

      // Step 1: Create Master Interview Record
      const interviewId = await insertInterview({
        application_id: input.application_id,
        company_id: input.company_id,
        talent_id: input.talent_id,
        mode: input.mode,
        meeting_link: input.meeting_link ?? null,
        location: input.location ?? null,
        note: input.note ?? null,
        duration_min: input.duration_min,
        created_by: u.user?.id,
      });

      // Step 2: Ingress Proposed Slots
      await insertInterviewSlots(
        input.slots.map((s) => ({
          interview_id: interviewId,
          starts_at: s,
          duration_min: input.duration_min,
          proposed_by_role: "recruiter",
        })),
      );

      const iv = { id: interviewId };

      // Step 3: Trigger Hiring Event Notification
      try {
        await notifyHiringEvent({ kind: "interview_proposed", ref: { interview_id: iv.id } });
      } catch (funcError) {
        console.error("[Digital Workforce] ANOMALY: notify-hiring-event failed for interview_proposed.", funcError);
      }

      return iv.id;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["application-hire-state", variables.application_id] });
      toast.success("Interview proposed and slots sent to candidate.");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to propose interview.");
    },
  });
}

// --- ACTION: CONFIRM_SLOT_TRANSACTION ---
export function useConfirmInterviewSlot() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      interviewId,
      slotId,
      applicationId,
    }: {
      interviewId: string;
      slotId: string;
      applicationId: string;
    }) => {
      // HUD: EXECUTING_RPC_SLOT_CONFIRMATION
      const { error: rpcError } = await supabase.rpc("confirm_interview_slot", {
        p_interview_id: interviewId,
        p_slot_id: slotId,
      });

      if (rpcError) throw rpcError;

      try {
        await notifyHiringEvent({ kind: "interview_confirmed", ref: { interview_id: interviewId } });
      } catch (funcError) {
        console.error("[Digital Workforce] ANOMALY: notify-hiring-event failed for interview_confirmed.", funcError);
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["application-hire-state", variables.applicationId] });
      toast.success("Interview confirmed! Calendar invites sent.");
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] FAULT: confirm_interview_slot transaction failed.", err);
      toast.error("Handshake failed. The slot may no longer be available.");
    },
  });
}
