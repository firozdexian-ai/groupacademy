import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Direct Messaging Sync & Ingress Hub (V5.6.0)
 * CTO Reference: Authoritative system hook handling real-time peer communication threads.
 * Architecture: Digital Workforce enabled - logs message handshake faults directly to Admin OS.
 * Phase: Z0 Code Freeze Hardened (2026 Launch Candidate).
 */

export interface DirectMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: "talent" | "recruiter" | "admin";
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface SendMessageInput {
  body: string;
  role: "talent" | "recruiter" | "admin";
}

export function useDirectMessages(threadId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ["direct-messages", threadId];

  // --------------------------------------------------------
  // PHASE: Declarative Stream Selection & Query Caching
  // --------------------------------------------------------
  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    enabled: !!threadId,
    // Real-time channel constraint: staleTime is set to zero to force immediate hydration updates
    staleTime: 0,
    queryFn: async (): Promise<DirectMessage[]> => {
      // HUD: EXECUTING_INDEX_THREAD_SELECT
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("thread_id", threadId!)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[Digital Workforce] FAULT: direct_messages historical selection failure.", {
          threadId,
          error: error.message,
        });
        throw error;
      }

      return (data ?? []) as DirectMessage[];
    },
  });

  // --------------------------------------------------------
  // PHASE: Postgres Realtime Channel Binding Strategy
  // --------------------------------------------------------
  useEffect(() => {
    if (!threadId) return;

    const channelName = `dm_realtime_${threadId}`;

    // HUD: BINDING_POSTGRES_CHANGES_SOCKET
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newMessage = payload.new as DirectMessage;

          // Execute safe cache update using React Query Client store
          queryClient.setQueryData<DirectMessage[]>(queryKey, (previous = []) => {
            // Deduplication logic to guard against parallel double updates from optimistic UI hits
            if (previous.some((msg) => msg.id === newMessage.id)) return previous;
            return [...previous, newMessage];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, queryClient, queryKey]);

  // --------------------------------------------------------
  // PHASE: Transaction Messaging Ingress Mutation
  // --------------------------------------------------------
  const sendMutation = useMutation({
    mutationFn: async (input: SendMessageInput) => {
      if (!threadId || !input.body.trim()) return;

      const { data: u, error: authError } = await supabase.auth.getUser();
      if (authError || !u.user) throw new Error("AUTH_SYNC_REQUIRED: Identity node untrusted.");

      // HUD: EXECUTING_MESSAGE_INGRESS_INSERT
      const { error: insertError } = await supabase.from("direct_messages").insert({
        thread_id: threadId,
        sender_id: u.user.id,
        sender_role: input.role,
        body: input.body.trim(),
      });

      if (insertError) throw insertError;
    },
    onError: (err: any, variables) => {
      // Digital Workforce Sensor: Intercept transmission friction points for real-time parsing
      console.error("[Digital Workforce] ANOMALY: direct_messages transaction handshake rejected.", {
        threadId,
        senderRole: variables.role,
        error: err.message,
      });
    },
    onSuccess: () => {
      // Re-trigger cache validation sweeps across direct message target keys cleanly
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    messages,
    loading: isLoading,
    send: async (body: string, role: "talent" | "recruiter" | "admin") => {
      await sendMutation.mutateAsync({ body, role });
    },
    isSending: sendMutation.isPending,
  };
}

/**
 * Atomic transaction helper ensuring database thread isolation nodes.
 * Enforced as an Immutable platform requirement handler function.
 */
export async function ensureDirectThread(companyId: string, talentId: string): Promise<string | null> {
  try {
    // HUD: EXECUTING_RPC_THREAD_UPSERT
    const { data, error } = await supabase.rpc("upsert_direct_thread" as any, {
      p_company_id: companyId,
      p_talent_id: talentId,
    });

    if (error) throw error;
    return data as string;
  } catch (err: any) {
    // Digital Workforce Failure Sensor capture point
    console.error("[Digital Workforce] ANOMALY: upsert_direct_thread RPC handshake failure.", {
      companyId,
      talentId,
      error: err?.message,
    });
    return null;
  }
}
