import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";

export interface MessageThread {
  id: string;
  talent_id: string;
  thread_type: "agent" | "system";
  agent_key: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  last_message_sender: string | null;
  unread_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  // joined agent metadata (filled client-side)
  agentName?: string;
  agentAvatarUrl?: string | null;
  agentColor?: string | null;
}

export function useMessageThreads() {
  const { talent } = useTalent();
  const talentId = talent?.id;
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    if (!talentId) {
      setThreads([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    // Ensure system thread exists
    await supabase.rpc("ensure_system_thread", { _talent_id: talentId });

    const { data: rows, error } = await supabase
      .from("message_threads")
      .select("*")
      .eq("talent_id", talentId)
      .eq("is_archived", false)
      .order("is_pinned", { ascending: false })
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("[Threads] fetch error", error);
      setIsLoading(false);
      return;
    }

    const agentKeys = Array.from(
      new Set((rows || []).filter((r) => r.thread_type === "agent" && r.agent_key).map((r) => r.agent_key as string)),
    );

    let agentMeta: Record<string, { name: string; avatar_url: string | null; color: string | null }> = {};
    if (agentKeys.length) {
      const { data: agents } = await supabase
        .from("ai_agents")
        .select("agent_key,name,avatar_url,color")
        .in("agent_key", agentKeys);
      (agents || []).forEach((a: any) => {
        agentMeta[a.agent_key] = { name: a.name, avatar_url: a.avatar_url, color: a.color };
      });
    }

    const enriched: MessageThread[] = (rows || []).map((r: any) => ({
      ...r,
      agentName:
        r.thread_type === "system"
          ? "AI General"
          : agentMeta[r.agent_key]?.name || r.agent_key || "Agent",
      agentAvatarUrl: r.thread_type === "system" ? null : agentMeta[r.agent_key]?.avatar_url ?? null,
      agentColor: r.thread_type === "system" ? "#2A7DDE" : agentMeta[r.agent_key]?.color ?? null,
    }));

    setThreads(enriched);
    setIsLoading(false);
  }, [talentId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Realtime subscription
  useEffect(() => {
    if (!talentId) return;
    const channel = supabase
      .channel(`threads_${talentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_threads", filter: `talent_id=eq.${talentId}` },
        () => fetchThreads(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [talentId, fetchThreads]);

  const markThreadRead = useCallback(async (threadId: string) => {
    const { error } = await supabase
      .from("message_threads")
      .update({ unread_count: 0 })
      .eq("id", threadId);
    if (!error) {
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, unread_count: 0 } : t)));
      // also flip notifications.is_read for system threads
      await supabase.from("notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("thread_id", threadId).eq("is_read", false);
    }
  }, []);

  const totalUnread = threads.reduce((sum, t) => sum + (t.unread_count || 0), 0);

  return { threads, isLoading, refresh: fetchThreads, markThreadRead, totalUnread };
}
