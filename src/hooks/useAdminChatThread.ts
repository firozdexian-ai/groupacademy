/**
 * useAdminChatThread — loads/persists a single per-admin per-agent thread
 * for the unified `/dashboard/chat` messenger. Persistence is client-side
 * (no edge function changes required): we replay full history when invoking
 * the agent, then store the resulting user+assistant turn.
 * * CTO Audit: Wired directly to the consolidated `admin-agents-router` Edge Function.
 */
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_AGENTS_BY_KEY } from "@/lib/adminAgents";

export interface ChatAttachment {
  name: string;
  path: string; // storage object path: <uid>/<thread>/<uuid>-<name>
  mime: string;
  size: number;
  url?: string; // signed URL (transient)
}

export type ChatMsg = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: ChatAttachment[];
  created_at?: string;
};

export interface ThreadSummary {
  id: string;
  agent_key: string;
  title: string | null;
  last_message_at: string;
  last_read_at: string;
}

const ATTACHMENT_BUCKET = "admin-chat-attachments";

export function useAdminThreads() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);

  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("admin_chat_threads")
      .select("id, agent_key, title, last_message_at, last_read_at")
      .order("last_message_at", { ascending: false });
    setThreads((data as any) ?? []);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { threads, reload };
}

async function signAttachments(atts: ChatAttachment[]): Promise<ChatAttachment[]> {
  if (!atts?.length) return [];
  const out: ChatAttachment[] = [];
  for (const a of atts) {
    const { data } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(a.path, 60 * 60);
    out.push({ ...a, url: data?.signedUrl });
  }
  return out;
}

export function useAdminChatThread(agentKey: string | null) {
  const queryClient = useQueryClient();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // load or create thread
  useEffect(() => {
    if (!agentKey) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      let { data: t } = await supabase
        .from("admin_chat_threads")
        .select("id")
        .eq("user_id", uid)
        .eq("agent_key", agentKey)
        .maybeSingle();
      if (!t) {
        const { data: created } = await supabase
          .from("admin_chat_threads")
          .insert({ user_id: uid, agent_key: agentKey })
          .select("id")
          .single();
        t = created;
      }
      if (cancelled || !t) return;
      setThreadId(t.id);
      const { data: msgs } = await supabase
        .from("admin_chat_messages")
        .select("id, role, content, attachments, created_at")
        .eq("thread_id", t.id)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      const rows = (msgs as any[]) ?? [];
      // sign URLs for any attachments so they render
      const enriched: ChatMsg[] = await Promise.all(
        rows.map(async (m) => ({
          ...m,
          attachments: await signAttachments(m.attachments ?? []),
        })),
      );
      if (!cancelled) setMessages(enriched);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [agentKey]);

  // realtime: mirror new messages from other tabs/devices
  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`admin_chat_${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const row: any = payload.new;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, { ...row, attachments: row.attachments ?? [] }];
          });
          if (row.attachments?.length) {
            const signed = await signAttachments(row.attachments);
            setMessages((prev) => prev.map((m) => (m.id === row.id ? { ...m, attachments: signed } : m)));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  // mark thread as read while it's open
  useEffect(() => {
    if (!threadId || messages.length === 0) return;
    supabase
      .from("admin_chat_threads")
      .update({ last_read_at: new Date().toISOString() })
      .eq("id", threadId)
      .then(() => {});
  }, [threadId, messages.length]);

  /**
   * Upload a File to the admin chat attachments bucket and return its
   * metadata (without signed URL). Caller is expected to attach this
   * to the next outgoing message.
   */
  const uploadAttachment = useCallback(
    async (file: File): Promise<ChatAttachment | null> => {
      if (!threadId) return null;
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return null;
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${uid}/${threadId}/${crypto.randomUUID()}-${safe}`;
      const { error } = await supabase.storage.from(ATTACHMENT_BUCKET).upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (error) {
        console.error("attachment upload failed", error);
        return null;
      }
      const { data: signed } = await supabase.storage.from(ATTACHMENT_BUCKET).createSignedUrl(path, 60 * 60);
      return {
        name: file.name,
        path,
        mime: file.type || "application/octet-stream",
        size: file.size,
        url: signed?.signedUrl,
      };
    },
    [threadId],
  );

  const send = useCallback(
    async (text: string, attachments: ChatAttachment[] = []) => {
      if (!agentKey || !threadId || sending) return;
      if (!text.trim() && attachments.length === 0) return;

      const userMsg: ChatMsg = {
        role: "user",
        content: text.trim(),
        attachments,
      };

      const next = [...messages, userMsg];
      setMessages(next);
      setSending(true);

      const titlePatch =
        messages.length === 0
          ? {
              title: userMsg.content.slice(0, 80) || attachments[0]?.name?.slice(0, 80) || "Attachment",
            }
          : {};

      // strip transient signed URL before persisting
      const persistAtts = attachments.map(({ url, ...rest }) => rest);

      await supabase.from("admin_chat_messages").insert({
        thread_id: threadId,
        role: "user",
        content: userMsg.content,
        attachments: persistAtts as any,
      });
      if (Object.keys(titlePatch).length) {
        await supabase.from("admin_chat_threads").update(titlePatch).eq("id", threadId);
      }

      try {
        const plainMessages = next.map(({ role, content }) => ({ role, content }));

        // CTO PATCH: Route all traffic through the consolidated admin-agents-router
        const { data, error } = await supabase.functions.invoke("admin-agents-router", {
          body: {
            agent_key: agentKey, // Dynamically pass the requested agent
            message: text.trim(),
            history: plainMessages.slice(0, -1), // Pass previous turns for context
            attachments: attachments.map(({ url: _u, ...rest }) => rest),
          },
        });

        if (error) throw error;

        const payload = data as any;
        if (payload?.error) {
          const detail = payload.detail
            ? ` — ${typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail)}`
            : "";
          throw new Error(`${payload.error}${detail}`);
        }

        // Ensure we properly map the 'reply' field from our new router structure
        const replyText = payload?.reply || payload?.content || "(no answer)";

        const reply: ChatMsg = {
          role: "assistant",
          content: replyText,
        };

        setMessages([...next, reply]);
        await supabase.from("admin_chat_messages").insert({
          thread_id: threadId,
          role: "assistant",
          content: reply.content,
        });

        // Phase D1 cache bridge: refresh admin tables after AI mutations.
        const invalidateKeys: string[] = Array.isArray(payload?.invalidate) ? payload.invalidate : [];
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      } catch (e: any) {
        const errMsg: ChatMsg = {
          role: "assistant",
          content: `_Error: ${e?.message ?? String(e)}_`,
        };
        setMessages([...next, errMsg]);
      } finally {
        setSending(false);
      }
    },
    [agentKey, threadId, messages, sending, queryClient],
  );

  const clear = useCallback(async () => {
    if (!threadId) return;
    await supabase.from("admin_chat_messages").delete().eq("thread_id", threadId);
    // best-effort: cleanup orphaned attachment files for this thread
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (uid) {
        const prefix = `${uid}/${threadId}`;
        const { data: list } = await supabase.storage.from(ATTACHMENT_BUCKET).list(prefix, { limit: 1000 });
        const paths = (list ?? []).map((f) => `${prefix}/${f.name}`);
        if (paths.length) {
          await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths);
        }
      }
    } catch (e) {
      console.warn("attachment cleanup failed", e);
    }
    setMessages([]);
  }, [threadId]);

  const regenerate = useCallback(async () => {
    if (!threadId || sending) return;
    // remove last assistant message and re-send the previous user turn
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx < 0) return;
    const lastUser = messages[lastUserIdx];
    // delete trailing assistant rows after lastUser
    const trailing = messages.slice(lastUserIdx + 1).filter((m) => m.id);
    if (trailing.length) {
      await supabase
        .from("admin_chat_messages")
        .delete()
        .in(
          "id",
          trailing.map((m) => m.id!),
        );
    }
    setMessages(messages.slice(0, lastUserIdx));
    await send(lastUser.content, lastUser.attachments ?? []);
  }, [threadId, sending, messages, send]);

  return {
    threadId,
    messages,
    loading,
    sending,
    send,
    clear,
    uploadAttachment,
    regenerate,
  };
}
