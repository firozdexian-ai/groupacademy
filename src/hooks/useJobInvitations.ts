import { supabase } from "@/integrations/supabase/client";

export async function inviteToApply(input: {
  job_id: string;
  company_id: string;
  talent_id: string;
  note?: string;
}): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("job_invitations")
    .insert({
      job_id: input.job_id,
      company_id: input.company_id,
      talent_id: input.talent_id,
      note: input.note ?? null,
      invited_by: u.user?.id,
    })
    .select("id")
    .single();
  if (error) return null;
  await supabase.functions.invoke("notify-hiring-event", {
    body: { kind: "job_invitation", ref: { invitation_id: data.id } },
  });
  return data.id;
}
