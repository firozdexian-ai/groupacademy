import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type InterviewMode = "video" | "phone" | "onsite";
export type InterviewStatus =
  | "proposed"
  | "confirmed"
  | "rescheduled"
  | "completed"
  | "no_show"
  | "cancelled";

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

export function useApplicationHireState(applicationId: string | undefined) {
  const [state, setState] = useState<HireState>({ interview: null, offer: null });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_application_hire_state", {
      p_application_id: applicationId,
    });
    if (!error) setState((data as any) ?? { interview: null, offer: null });
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, loading, reload: load };
}

export async function createInterview(input: {
  application_id: string;
  company_id: string;
  talent_id: string;
  mode: InterviewMode;
  meeting_link?: string;
  location?: string;
  note?: string;
  duration_min: number;
  slots: string[]; // ISO timestamps
}): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  const { data: iv, error } = await supabase
    .from("interviews")
    .insert({
      application_id: input.application_id,
      company_id: input.company_id,
      talent_id: input.talent_id,
      mode: input.mode,
      meeting_link: input.meeting_link ?? null,
      location: input.location ?? null,
      note: input.note ?? null,
      duration_min: input.duration_min,
      created_by: u.user?.id,
    })
    .select("id")
    .single();
  if (error || !iv) return null;
  if (input.slots.length) {
    await supabase.from("interview_slots").insert(
      input.slots.map((s) => ({
        interview_id: iv.id,
        starts_at: s,
        duration_min: input.duration_min,
        proposed_by_role: "recruiter",
      })),
    );
  }
  await supabase.functions.invoke("notify-hiring-event", {
    body: { kind: "interview_proposed", ref: { interview_id: iv.id } },
  });
  return iv.id;
}

export async function confirmInterviewSlot(interviewId: string, slotId: string) {
  const { error } = await supabase.rpc("confirm_interview_slot", {
    p_interview_id: interviewId,
    p_slot_id: slotId,
  });
  if (!error) {
    await supabase.functions.invoke("notify-hiring-event", {
      body: { kind: "interview_confirmed", ref: { interview_id: interviewId } },
    });
  }
  return !error;
}
