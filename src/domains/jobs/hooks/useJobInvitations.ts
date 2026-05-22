import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { notifyHiringEvent } from "@/domains/jobs/api/jobsApi";
import { insertJobInvitation } from "@/domains/jobs/repo/jobsRepo";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { toast } from "sonner";

/**
 * GroUp Academy: Talent Sourcing & Invitation Engine (V5.6.0)
 * CTO Reference: Primary handler for outbound recruiter-to-talent engagement.
 * Architecture: Digital Workforce enabled - logs communication faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Edition).
 */

export interface InviteToApplyInput {
  job_id: string;
  company_id: string;
  talent_id: string;
  note?: string;
}

/**
 * Manages the "Invite to Apply" transaction.
 * Leverages TanStack Mutations to prevent double-submissions and manage state.
 */
export function useInviteToApply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InviteToApplyInput): Promise<string> => {
      const user = await getCurrentUser();
      if (!user) throw new Error("AUTH_REQUIRED: Please sign in to invite talent.");

      // HUD: EXECUTING_JOB_INVITATION_INSERT
      let data: { id: string };
      try {
        data = await insertJobInvitation({
          job_id: input.job_id,
          company_id: input.company_id,
          talent_id: input.talent_id,
          note: input.note ?? null,
          invited_by: user.id,
        });
      } catch (error: any) {
        console.error("[Digital Workforce] FAULT: job_invitations insert failed.", error);
        throw error;
      }


      // HUD: EDGE_INVOCATION_NOTIFICATION_HANDSHAKE
      try {
        await notifyHiringEvent({
          kind: "job_invitation",
          ref: { invitation_id: data.id },
        });
      } catch (err) {
        // Digital Workforce Anomaly Trigger:
        // We log this but don't fail the mutation, as the record was saved.
        const message =
          err instanceof EdgeFunctionError ? err.message : String(err);
        console.error(
          "[Digital Workforce] ANOMALY: notify-hiring-event failed for job_invitation.",
          { invitation_id: data.id, message },
        );
      }

      return data.id;
    },
    onSuccess: () => {
      // Invalidate sourcing caches to show the "Invited" status on candidate cards
      queryClient.invalidateQueries({ queryKey: ["talent-search"] });
      queryClient.invalidateQueries({ queryKey: ["employer-pipeline"] });
      toast.success("Invitation sent to candidate.");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to send invitation. Handshake timeout.");
    },
  });
}
