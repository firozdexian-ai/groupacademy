import { supabase } from "@/integrations/supabase/client";

/**
 * CTO Note:
 * These keys must match the TEMPLATES map in registry.ts
 */
export type TemplateKey =
  | "welcome"
  | "service-complete"
  | "bid-accepted"
  | "credit-receipt"
  | "job-application-sent"
  | "job-application-employer"
  | "talent-invite"
  | "investor-update";

interface SendEmailParams {
  template: TemplateKey;
  talentId?: string;
  recipientEmail?: string;
  data?: Record<string, any>;
}

/**
 * Exported core function for direct use (e.g., in ReportCard)
 */
export async function sendTransactionalEmail({
  template,
  talentId,
  recipientEmail,
  data,
}: SendEmailParams): Promise<boolean> {
  try {
    const { data: result, error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        template,
        talent_id: talentId,
        recipient_email: recipientEmail,
        data,
      },
    });

    if (error) {
      console.warn(`[Email] Queue failed for ${template}:`, error.message);
      return false;
    }

    return result?.success === true;
  } catch (err) {
    console.warn(`[Email] Unexpected error in helper:`, err);
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

  investorUpdate: (recipientEmail: string, subject: string, content: string) =>
    sendTransactionalEmail({
      template: "investor-update",
      recipientEmail,
      data: { subject, content },
    }),
};
