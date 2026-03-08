import { supabase } from "@/integrations/supabase/client";

type EmailType = "welcome" | "service_complete" | "bid_accepted" | "credit_receipt";

interface SendEmailParams {
  type: EmailType;
  talentId: string;
  data?: Record<string, any>;
}

/**
 * Fire-and-forget transactional email sender.
 * Calls the send-transactional-email edge function.
 * Never throws — logs errors silently so callers aren't blocked.
 */
export async function sendTransactionalEmail({ type, talentId, data }: SendEmailParams): Promise<boolean> {
  try {
    const { data: result, error } = await supabase.functions.invoke("send-transactional-email", {
      body: { type, talent_id: talentId, data },
    });

    if (error) {
      console.warn(`[Email] Failed to send ${type} email:`, error.message);
      return false;
    }

    return result?.success === true;
  } catch (err) {
    console.warn(`[Email] Unexpected error sending ${type} email:`, err);
    return false;
  }
}

/**
 * Convenience helpers
 */
export const emailNotifications = {
  welcome: (talentId: string) =>
    sendTransactionalEmail({ type: "welcome", talentId }),

  serviceComplete: (talentId: string, serviceName: string, summary: string) =>
    sendTransactionalEmail({
      type: "service_complete",
      talentId,
      data: { service_name: serviceName, summary },
    }),

  bidAccepted: (talentId: string, gigTitle: string, creditsAwarded: number) =>
    sendTransactionalEmail({
      type: "bid_accepted",
      talentId,
      data: { gig_title: gigTitle, credits_awarded: creditsAwarded },
    }),

  creditReceipt: (talentId: string, amount: number, newBalance: number, transactionType: string) =>
    sendTransactionalEmail({
      type: "credit_receipt",
      talentId,
      data: { amount, new_balance: newBalance, transaction_type: transactionType },
    }),
};
