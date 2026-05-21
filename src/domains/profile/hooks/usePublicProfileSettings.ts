import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { claimPublicHandle } from "@/domains/profile/api/profileApi";
import { getPublicProfileSettings, updatePublicProfileSettings } from "@/domains/profile/repo/profileRepo";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";


/**
 * GroUp Academy: Identity & Privacy Sentinel (V5.6.0)
 * CTO Reference: Authoritative controller managing recruitment profile visibility grids.
 * Architecture: Digital Workforce enabled - logs identity and handle collision dropouts to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface PublicProfileSettings {
  public_handle: string | null;
  public_profile_enabled: boolean;
  public_show_mastery: boolean;
  public_show_credentials: boolean;
  public_bio: string | null;
}

/**
 * Orchestrates public visibility matrices and automated edge handle reservations.
 */
export function usePublicProfileSettings() {
  const { talent } = useTalent();
  const qc = useQueryClient();
  const queryKey = ["public-profile-settings", talent?.id];

  // --- SENSOR: PRIVACY_CONFIGURATION_OBSERVER ---
  const query = useQuery({
    queryKey,
    enabled: !!talent?.id,
    staleTime: 60 * 1000, // 1-minute safety window for privacy configs
    queryFn: async (): Promise<PublicProfileSettings | null> => {
      try {
        return await getPublicProfileSettings(talent!.id);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: public_profile_settings lookup failed.", error);
        throw error;
      }
    },
  });

  // --- ACTION: PRIVACY_MATRIX_MUTATION ---
  const update = useMutation({
    mutationFn: async (patch: Partial<PublicProfileSettings>) => {
      if (!talent?.id) throw new Error("no_talent");
      try {
        await updatePublicProfileSettings(talent.id, patch);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: talents privacy parameters write rejected.", error);
        throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey });
      toast.success("Profile privacy controls configured successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to commit visibility settings changes.");
    },
  });

  // --- ACTION: PUBLIC_HANDLE_EDGE_MUTATION ---
  const claimHandle = useMutation({
    mutationFn: async (handle: string): Promise<{ handle: string }> => {
      // HUD: INVOKING_HANDLE_CLAIM_EDGE_ORCHESTRATOR
      let res: { error?: string; message?: string; handle?: string };
      try {
        res = await claimPublicHandle({ handle });
      } catch (error: any) {
        // Digital Workforce Anomaly Trigger: Essential for catching routing or gateway timeouts
        console.error("[Digital Workforce] ANOMALY: claim-public-handle infrastructure failure.", {
          talentId: talent?.id,
          message: error?.message,
        });
        throw error;
      }

      if (res?.error) {
        throw new Error(res.message || res.error);
      }

      return { handle: res?.handle || handle };
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey });
      toast.success(`Custom URL claimed successfully: @${data.handle}`);
    },
    onError: (err: any) => {
      console.warn("[Digital Workforce] ANOMALY: Custom slug reservation denied due to validation logic.", err.message);
      toast.error(err.message || "This unique handle has already been reserved by another talent node.");
    },
  });

  return {
    ...query,
    update,
    claimHandle,
  };
}
