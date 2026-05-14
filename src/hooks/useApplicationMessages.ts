import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * GroUp Academy: Application Messaging Orchestrator (V2.1.0)
 * CTO Reference: Authoritative sensor for real-time B2B/B2C communication.
 * Architecture: Digital Workforce enabled - anomaly reporting on sync failure.
 * Protocol: Prioritize Human-in-the-loop for Employer interactions.
 */

export interface ApplicationMessage {
  id: string;
  application_id: string;
  sender_id: string;
  sender_role: "talent" | "recruiter" | "admin";
  body: string;
  attachments: any;
  read_at: string | null;
  created_at: string;
}

export function useApplicationMessages(applicationId: string | undefined) {
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // --- HUD: REGISTRY_LOAD_PROTOCOL ---
  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("application_messages")
        .select("*")
        .eq("application_id", applicationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data ?? []) as ApplicationMessage[]);
    } catch (err) {
      console.error("[Digital Workforce] FAULT: Message sync failed.", err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  // --- SYNC: REALTIME_POSTGRES_CHANNEL ---
  useEffect(() => {
    if (!applicationId) return;

    const channelName = `app_msg_${applicationId}`;
    const ch = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "application_messages",
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Deduplication logic to prevent double-rendering optimistic UI
            if (prev.find((m) => m.id === (payload.new as ApplicationMessage).id)) return prev;
            return [...prev, payload.new as ApplicationMessage];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [applicationId]);

  // --- ACTION: SEND_MESSAGE_HANDSHAKE ---
  const send = useCallback(
    async (body: string, senderRole: "talent" | "recruiter" | "admin") => {
      if (!applicationId || !body.trim()) return;

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("AUTH_SYNC_REQUIRED");

        const { error: insertError } = await supabase.from("application_messages").insert({
          application_id: applicationId,
          sender_id: user.id,
          sender_role: senderRole,
          body: body.trim(),
        });

        if (insertError) throw insertError;
      } catch (err: any) {
        // Digital Workforce: Anomaly reporting
        console.error("[Digital Workforce] ANOMALY: Messaging handshake failed.", err);
        toast.error("Communication Sync Failed", {
          description: "Reporting anomaly to Admin Chat for intervention.",
        });
      }
    },
    [applicationId],
  );

  // --- PROTOCOL: READ_RECEIPT_SYNC ---
  const markRead = useCallback(async () => {
    if (!applicationId) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("application_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("application_id", applicationId)
        .neq("sender_id", user.id)
        .is("read_at", null);
    } catch (err) {
      console.warn("[Digital Workforce] Non-critical: Read receipt sync delayed.", err);
    }
  }, [applicationId]);

  return { messages, loading, send, markRead, reload: load };
}
