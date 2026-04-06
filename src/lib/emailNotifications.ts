import { supabase } from "@/integrations/supabase/client";

/**
 * Valid templates registered in our Edge Function registry
 */
type TemplateKey =
  | "welcome"
  | "service-complete"
  | "bid-accepted"
  | "credit-receipt"
  | "job-application-sent"
  | "talent-invite";

interface SendEmailParams {
  template: TemplateKey;
  talentId: string;
  data?: Record<string, any>;
}

export async function sendTransactionalEmail({ template, talentId, data }: SendEmailParams): Promise<boolean> {
  try {
    const { data: result, error } = await supabase.functions.invoke("send-transactional-email", {
      body: { template, talent_id: talentId, data },
    });

    if (error) {
      console.warn(`[Email] Failed to queue ${template}:`, error.message);
      return false;
    }

    return result?.success === true;
  } catch (err) {
    console.warn(`[Email] Unexpected error queueing ${template}:`, err);
    return false;
  }
}

export const emailNotifications = {
  welcome: (talentId: string) => sendTransactionalEmail({ template: "welcome", talentId }),

  serviceComplete: (talentId: string, serviceName: string, summary: string) =>
    sendTransactionalEmail({
      template: "service-complete",
      talentId,
      data: { service_name: serviceName, summary },
    }),

  bidAccepted: (talentId: string, gigTitle: string, creditsAwarded: number) =>
    sendTransactionalEmail({
      template: "bid-accepted",
      talentId,
      data: { gig_title: gigTitle, credits_awarded: creditsAwarded },
    }),

  creditReceipt: (talentId: string, amount: number, newBalance: number, transactionType: string) =>
    sendTransactionalEmail({
      template: "credit-receipt",
      talentId,
      data: { amount, new_balance: newBalance, transaction_type: transactionType },
    }),

  talentInvite: (talentId: string, personalNote?: string) =>
    sendTransactionalEmail({
      template: "talent-invite",
      talentId,
      data: { personal_note: personalNote },
    }),
};
