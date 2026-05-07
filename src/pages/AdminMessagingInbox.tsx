import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Loader2, Bot, User } from "lucide-react";

interface Conversation {
  id: string;
  channel_id: string;
  external_chat_id: string;
  peer_display_name: string | null;
  peer_handle: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  auto_reply_paused: boolean;
}

interface Message {
  id: string;
  direction: "in" | "out";
  author: "user" | "human_operator" | "agent" | "system";
  body: string | null;
  created_at: string;
  status: string;
}

export default function AdminMessagingInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConvs = async () => {
    // Safety: hide 1-on-1 chats with no resolved contact (prevents stranger DMs leaking into admin inbox)
    const { data } = await supabase
      .from("messaging_conversations")
      .select("*")
      .or("is_group.eq.true,contact_id.not.is.null")
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .limit(100);
    setConversations((data ?? []) as Conversation[]);
    setLoadingConvs(false);
  };

  const loadMessages = async (id: string) => {
    const { data } = await supabase
      .from("messaging_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(200);
    setMessages((data ?? []) as Message[]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
  };

  useEffect(() => {
    loadConvs();
    const ch = supabase
      .channel("messaging_inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "messaging_conversations" }, () => loadConvs())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messaging_messages" }, (payload: any) => {
        if (payload.new?.conversation_id === activeId) loadMessages(activeId);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  useEffect(() => { if (activeId) loadMessages(activeId); }, [activeId]);

  const active = conversations.find((c) => c.id === activeId);

  const send = async () => {
    if (!composer.trim() || !activeId) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("messaging-send", {
        body: { conversation_id: activeId, text: composer.trim() },
      });
      if (error) throw error;
      if (!data?.ok && data?.error) toast.error(data.error);
      setComposer("");
      await loadMessages(activeId);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSending(false); }
  };

  const toggleHumanTakeover = async (paused: boolean) => {
    if (!activeId) return;
    await supabase.from("messaging_conversations").update({ auto_reply_paused: paused }).eq("id", activeId);
    loadConvs();
  };

  return (
    <div className="h-[calc(100vh-8rem)] grid grid-cols-1 md:grid-cols-[320px_1fr] gap-3 p-3">
      <Card className="overflow-hidden flex flex-col">
        <div className="p-3 border-b font-semibold">Conversations</div>
        <ScrollArea className="flex-1">
          {loadingConvs ? (
            <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No conversations yet.</div>
          ) : conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`w-full text-left p-3 border-b hover:bg-muted/50 ${activeId === c.id ? "bg-muted" : ""}`}
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium truncate">{c.peer_display_name || c.peer_handle || "Unknown"}</span>
                {c.unread_count > 0 && <Badge>{c.unread_count}</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{c.last_message_preview || "—"}</p>
            </button>
          ))}
        </ScrollArea>
      </Card>

      <Card className="overflow-hidden flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation</div>
        ) : (
          <>
            <div className="p-3 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">{active.peer_display_name || active.peer_handle}</div>
                <div className="text-xs text-muted-foreground">{active.external_chat_id}</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>Human takeover</span>
                <Switch checked={active.auto_reply_paused} onCheckedChange={toggleHumanTakeover} />
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.direction === "out" ? "bg-primary text-primary-foreground" : "bg-background border"}`}>
                    {m.author === "agent" && <div className="flex items-center gap-1 text-xs opacity-70 mb-1"><Bot className="h-3 w-3" /> AI</div>}
                    {m.author === "human_operator" && m.direction === "out" && <div className="flex items-center gap-1 text-xs opacity-70 mb-1"><User className="h-3 w-3" /> You</div>}
                    <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    <div className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <Input
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type a message…"
                disabled={sending}
              />
              <Button onClick={send} disabled={sending || !composer.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
