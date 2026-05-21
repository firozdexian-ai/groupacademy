import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyHiringEvent } from "@/domains/jobs/api/jobsApi";
import { insertOffer, updateOfferStatus } from "@/domains/jobs/repo/jobsRepo";

/**
 * GroUp Academy: Legal & Offer Finality Suite (V5.6.0)
 * CTO Reference: Authoritative transactional interface for binding employment contracts.
 * Architecture: Digital Workforce enabled - logs fiscal state failures to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export type OfferStatus = "draft" | "sent" | "accepted" | "declined" | "countered" | "expired" | "withdrawn";

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

// --- MUTATION: CREATE_OFFER_LEDGER ---
export function useCreateOffer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Partial<Offer> & {
        application_id: string;
        company_id: string;
        talent_id: string;
        title: string;
      },
    ): Promise<string> => {
      const { data: u, error: authError } = await supabase.auth.getUser();
      if (authError || !u.user) throw new Error("Authentication session required.");

      try {
        return await insertOffer({
          ...input,
          base_amount: input.base_amount ?? 0,
          currency: input.currency ?? "USD",
          created_by: u.user.id,
        });
      } catch (error) {
        console.error("[Digital Workforce] FAULT: offers registry insertion rejected.", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["application-hire-state", variables.application_id] });
      toast.success("Offer document draft formalized successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to initialize offer ledger record.");
    },
  });
}

// --- MUTATION: SEND_OFFER_DISPATCH ---
export function useSendOffer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, applicationId }: { offerId: string; applicationId: string }) => {
      await updateOfferStatus(offerId, "sent");

      // HUD: EDGE_NOTIFY_DISPATCH_HANDSHAKE
      try {
        await notifyHiringEvent({ kind: "offer_sent", ref: { offer_id: offerId } });
      } catch (funcError: any) {
        console.error("[Digital Workforce] ANOMALY: notify-hiring-event failed for offer_sent.", {
          offerId,
          message: funcError?.message,
        });
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["application-hire-state", variables.applicationId] });
      toast.success("Offer letter systematically dispatched to candidate.");
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] FAULT: sendOffer dispatch rejected.", err);
      toast.error(err.message ?? "Failed to dispatch contract.");
    },
  });
}

// --- MUTATION: ACCEPT_OFFER_SIGNATURE ---
export function useAcceptOffer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      offerId,
      signedName,
      applicationId,
    }: {
      offerId: string;
      signedName: string;
      applicationId: string;
    }) => {
      // HUD: EXECUTING_RPC_OFFER_SIGNATURE_ACCEPT
      const { error } = await supabase.rpc("accept_offer", {
        p_offer_id: offerId,
        p_signed_name: signedName,
      });

      if (error) {
        console.error("[Digital Workforce] FAULT: accept_offer transaction verification failed.", error);
        throw error;
      }

      try {
        await notifyHiringEvent({ kind: "offer_accepted", ref: { offer_id: offerId } });
      } catch (funcError: any) {
        console.error("[Digital Workforce] ANOMALY: notify-hiring-event failed for offer_accepted.", {
          offerId,
          message: funcError?.message,
        });
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["application-hire-state", variables.applicationId] });
      qc.invalidateQueries({ queryKey: ["instructor-summary"] }); // Force synchronization if partner onboarding
      toast.success("Contract signed and executed successfully! Welcome aboard.");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Signature mapping handshake failed.");
    },
  });
}

// --- MUTATION: DECLINE_OFFER_DISMISSAL ---
export function useDeclineOffer() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId, note, applicationId }: { offerId: string; note?: string; applicationId: string }) => {
      // HUD: EXECUTING_RPC_OFFER_DECLINE
      const { error } = await supabase.rpc("decline_offer", {
        p_offer_id: offerId,
        p_note: note ?? null,
      });

      if (error) {
        console.error("[Digital Workforce] FAULT: decline_offer transaction rejected by schema rules.", error);
        throw error;
      }

      try {
        await notifyHiringEvent({ kind: "offer_declined", ref: { offer_id: offerId } });
      } catch (funcError: any) {
        console.error("[Digital Workforce] ANOMALY: notify-hiring-event failed for offer_declined.", {
          offerId,
          message: funcError?.message,
        });
      }
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["application-hire-state", variables.applicationId] });
      toast.error("Offer declined. Pipeline record localized.");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Declination registration failed.");
    },
  });
}
