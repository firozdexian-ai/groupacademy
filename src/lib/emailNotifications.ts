import { supabase } from "@/integrations/supabase/client";

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
  recipientEmail: string;
  idempotencyKey: string;
  data?: Record<string, any>;
}

export async function sendTransactionalEmail({
  template,
  recipientEmail,
  idempotencyKey,
  data,
}: SendEmailParams): Promise<boolean> {
  try {
    const { data: result, error } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: template,
        recipientEmail,
        idempotencyKey,
        templateData: data,
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

/**
 * Helper to look up a talent's email by ID, then send.
 * Used when we only have a talent_id (e.g., from gig approval).
 */
async function sendToTalent(
  talentId: string,
  template: TemplateKey,
  idempotencyKeySuffix: string,
  data?: Record<string, any>,
): Promise<boolean> {
  const { data: talent, error } = await supabase
    .from("talents")
    .select("email, full_name")
    .eq("id", talentId)
    .single();

  if (error || !talent?.email) {
    console.warn(`[Email] Could not find talent ${talentId}`);
    return false;
  }

  return sendTransactionalEmail({
    template,
    recipientEmail: talent.email,
    idempotencyKey: `${template}-${idempotencyKeySuffix}`,
    data: { name: talent.full_name || "there", ...data },
  });
}

export const emailNotifications = {
  welcome: (talentId: string) => sendToTalent(talentId, "welcome", talentId),

  serviceComplete: (talentId: string, serviceName: string, summary: string) =>
    sendToTalent(talentId, "service-complete", `${talentId}-${Date.now()}`, {
      service_name: serviceName,
      summary,
    }),

  bidAccepted: (talentId: string, gigTitle: string, creditsAwarded: number) =>
    sendToTalent(talentId, "bid-accepted", `${talentId}-${Date.now()}`, {
      gig_title: gigTitle,
      credits_awarded: creditsAwarded,
    }),

  creditReceipt: (talentId: string, amount: number, newBalance: number, transactionType: string) =>
    sendToTalent(talentId, "credit-receipt", `${talentId}-${Date.now()}`, {
      amount,
      new_balance: newBalance,
      transaction_type: transactionType,
    }),

  jobApplicationSent: (recipientEmail: string, jobTitle: string, companyName: string, applicantName: string) =>
    sendTransactionalEmail({
      template: "job-application-sent",
      recipientEmail,
      idempotencyKey: `job-app-sent-${recipientEmail}-${Date.now()}`,
      data: { name: applicantName, job_title: jobTitle, company_name: companyName },
    }),

  talentInvite: (talentId: string, personalNote?: string) =>
    sendToTalent(talentId, "talent-invite", talentId, {
      personal_note: personalNote,
    }),

  investorUpdate: (recipientEmail: string, subject: string, content: string) =>
    sendTransactionalEmail({
      template: "investor-update",
      recipientEmail,
      idempotencyKey: `investor-update-${recipientEmail}-${Date.now()}`,
      data: { subject, content },
    }),
};
