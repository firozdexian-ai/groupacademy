import { supabase } from "@/integrations/supabase/client";

export type OfferStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "countered"
  | "expired"
  | "withdrawn";

export interface Offer {
  id: string;
  application_id: string;
  company_id: string;
  talent_id: string;
  title: string;
  start_date: string | null;
  currency: string;
  base_amount: number;
  variable_amount: number | null;
  equity_note: string | null;
  benefits: string | null;
  custom_note: string | null;
  expires_at: string | null;
  pdf_path: string | null;
  status: OfferStatus;
  signed_name: string | null;
  signed_at: string | null;
  decision_note: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export async function createOffer(input: Partial<Offer> & {
  application_id: string;
  company_id: string;
  talent_id: string;
  title: string;
}): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("offers")
    .insert({
      ...input,
      base_amount: input.base_amount ?? 0,
      currency: input.currency ?? "USD",
      created_by: u.user?.id,
    })
    .select("id")
    .single();
  if (error) return null;
  return data.id;
}

export async function sendOffer(offerId: string) {
  const { error } = await supabase
    .from("offers")
    .update({ status: "sent" })
    .eq("id", offerId);
  if (!error) {
    await supabase.functions.invoke("notify-hiring-event", {
      body: { kind: "offer_sent", ref: { offer_id: offerId } },
    });
  }
  return !error;
}

export async function acceptOffer(offerId: string, signedName: string) {
  const { error } = await supabase.rpc("accept_offer", {
    p_offer_id: offerId,
    p_signed_name: signedName,
  });
  if (!error) {
    await supabase.functions.invoke("notify-hiring-event", {
      body: { kind: "offer_accepted", ref: { offer_id: offerId } },
    });
  }
  return !error;
}

export async function declineOffer(offerId: string, note?: string) {
  const { error } = await supabase.rpc("decline_offer", {
    p_offer_id: offerId,
    p_note: note ?? null,
  });
  if (!error) {
    await supabase.functions.invoke("notify-hiring-event", {
      body: { kind: "offer_declined", ref: { offer_id: offerId } },
    });
  }
  return !error;
}
