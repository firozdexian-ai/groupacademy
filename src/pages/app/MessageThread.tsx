import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Bot, Sparkles, User as UserIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/components/messages/ChatBubble";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useMessageThreads } from "@/hooks/useMessageThreads";
import { format } from "date-fns";

/**
 * Single thread view. /app/messages/system shows the AI General system feed.
 * /app/messages/:agentKey shows an agent conversation.
 */
export default function MessageThread() {
  const { threadKey } = useParams<{ threadKey: string }>();
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { markThreadRead } = useMessageThreads();
  const isSystem = threadKey === "system";
  const scrollRef = useRef<HTMLDivElement>(null);

  // ------- System / AI General thread (renders notifications) -------
  const [notifications, setNotifications] = useState<any[]>([]);
  const [systemThreadId, setSystemThreadId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSystem || !talent?.id) return;
    (async () => {
      const { data: tid } = await supabase.rpc("ensure_system_thread", { _talent_id: talent.id });
      setSystemThreadId(tid as string | null);
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: true })
        .limit(200);
      setNotifications(data || []);
      if (tid) markThreadRead(tid as string);
    })();
  }, [isSystem, talent?.id, markThreadRead]);

  // ------- Agent thread -------
  const {
    messages,
    isStreaming,
    sendMessage,
    startOrResumeSession,
    perResponseCost,
  } = useAgentChat();
  const [agent, setAgent] = useState<any>(null);
  const [input, setInput] = useState("");
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    if (isSystem || !threadKey) return;
    (async () => {
      setBootstrapping(true);
      const { data } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("agent_key", threadKey)
        .maybeSingle();
      setAgent(data);
      await startOrResumeSession(threadKey);
      // mark thread read
      if (talent?.id) {
        const { data: row } = await supabase
          .from("message_threads")
          .select("id")
          .eq("talent_id", talent.id)
          .eq("agent_key", threadKey)
          .maybeSingle();
        if (row?.id) markThreadRead(row.id);
      }
      setBootstrapping(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadKey, isSystem]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, notifications]);

  const headerName = isSystem ? "AI General" : agent?.name || "Agent";
  const headerAvatar = isSystem ? null : agent?.avatar_url;
  const headerColor = isSystem ? "#2A7DDE" : agent?.bg_color || "#10D576";

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-env(safe-area-inset-bottom))] max-w-2xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 flex items-center gap-2 px-2 py-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/app/messages")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9 rounded-full">
          {headerAvatar && <AvatarImage src={headerAvatar} alt={headerName} />}
          <AvatarFallback className="rounded-full text-white" style={{ backgroundColor: headerColor }}>
            {isSystem ? <Sparkles className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{headerName}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {isSystem
              ? "Platform updates & alerts"
              : isStreaming
              ? "Typing…"
              : `${perResponseCost} credit per reply`}
          </p>
        </div>
        {!isSystem && agent && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={() => navigate(`/app/agents/${threadKey}/profile`)}
          >
            View Profile
          </Button>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 bg-muted/20">
        {isSystem ? (
          notifications.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">No system messages yet.</div>
          ) : (
            notifications.map((n) => (
              <ChatBubble
                key={n.id}
                role="assistant"
                content={`${n.title}${n.message ? `\n${n.message}` : ""}`}
                timestamp={format(new Date(n.created_at), "MMM d, h:mm a")}
                ctaLabel={n.link ? "Open" : undefined}
                ctaLink={n.link || undefined}
              />
            ))
          )
        ) : bootstrapping ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            Say hi to {headerName} 👋
          </div>
        ) : (
          messages.map((m, i) => <ChatBubble key={i} role={m.role} content={m.content} />)
        )}
        {isStreaming && !isSystem && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> {headerName} is typing…
          </div>
        )}
      </div>

      {/* Composer (hidden for system thread) */}
      {!isSystem && (
        <div className="border-t border-border/40 bg-background px-2 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] flex items-center gap-2">
          <Input
            placeholder={`Message ${headerName}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="h-10 rounded-full bg-muted/40 border-none"
            disabled={isStreaming || bootstrapping}
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || bootstrapping}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
