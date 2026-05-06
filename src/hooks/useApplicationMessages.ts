import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    const { data } = await supabase
      .from("application_messages")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as ApplicationMessage[]);
    setLoading(false);
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!applicationId) return;
    const ch = supabase
      .channel(`app_msg_${applicationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "application_messages",
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ApplicationMessage]);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [applicationId]);

  const send = useCallback(
    async (body: string, senderRole: "talent" | "recruiter" | "admin") => {
      if (!applicationId || !body.trim()) return;
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase.from("application_messages").insert({
        application_id: applicationId,
        sender_id: u.user.id,
        sender_role: senderRole,
        body: body.trim(),
      });
    },
    [applicationId],
  );

  const markRead = useCallback(async () => {
    if (!applicationId) return;
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase
      .from("application_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("application_id", applicationId)
      .neq("sender_id", u.user.id)
      .is("read_at", null);
  }, [applicationId]);

  return { messages, loading, send, markRead, reload: load };
}
