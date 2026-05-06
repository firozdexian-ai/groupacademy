import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DirectMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: "talent" | "recruiter" | "admin";
  body: string;
  read_at: string | null;
  created_at: string;
}

export function useDirectMessages(threadId: string | undefined) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as DirectMessage[]);
    setLoading(false);
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!threadId) return;
    const ch = supabase
      .channel(`dm_${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => setMessages((p) => [...p, payload.new as DirectMessage]),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [threadId]);

  const send = useCallback(
    async (body: string, role: "talent" | "recruiter" | "admin") => {
      if (!threadId || !body.trim()) return;
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      await supabase.from("direct_messages").insert({
        thread_id: threadId,
        sender_id: u.user.id,
        sender_role: role,
        body: body.trim(),
      });
    },
    [threadId],
  );

  return { messages, loading, send };
}

export async function ensureDirectThread(companyId: string, talentId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("upsert_direct_thread", {
    p_company_id: companyId,
    p_talent_id: talentId,
  });
  if (error) return null;
  return data as string;
}
