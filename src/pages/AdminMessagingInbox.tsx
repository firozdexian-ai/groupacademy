import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Send, Loader2, Bot, User, MessageSquare, ShieldAlert, Users, Phone, List } from "lucide-react";

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
  contact_id: string | null;
  is_group: boolean;
  messaging_channels?: {
    agent_key: string;
    phone_e164: string | null;
  };
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
  // CTO Patch: Default to "all" so inbound Talent messages (which lack a B2B contact_id) are never hidden
  const [activeTab, setActiveTab] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConvs = async () => {
    setLoadingConvs(true);
    let query = supabase
      .from("messaging_conversations")
      .select("*, messaging_channels(agent_key, phone_e164)")
      .order("last_message_at", { ascending: false, nullsFirst: false });

    // CTO Filter Logic: Adjusted to accurately reflect B2B vs B2C routing
    if (activeTab === "employers") {
      query = query.not("contact_id", "is", null);
    } else if (activeTab === "talents_unmatched") {
      query = query.is("contact_id", null).eq("is_group", false);
    } else if (activeTab === "groups") {
      query = query.eq("is_group", true);
    }
    // "all" applies no filters

    const { data } = await query.limit(100);
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
      .channel("messaging_inbox_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "messaging_conversations" }, () => loadConvs())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messaging_messages" }, (payload: any) => {
        if (payload.new?.conversation_id === activeId) loadMessages(activeId);
        if (payload.new?.direction === "in") toast.info("New message received");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeId, activeTab]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId]);

  const active = conversations.find((c) => c.id === activeId);

  const send = async () => {
    if (!composer.trim() || !activeId) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("messaging-send", {
        body: { conversation_id: activeId, text: composer.trim() },
      });
      if (error) throw error;
      setComposer("");
      await loadMessages(activeId);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  const toggleHumanTakeover = async (paused: boolean) => {
    if (!activeId) return;
    await supabase.from("messaging_conversations").update({ auto_reply_paused: paused }).eq("id", activeId);
    loadConvs();
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col p-4 gap-4 bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Mission Control: Messaging</h1>
          <p className="text-xs text-muted-foreground">Monitoring AI Agents and Stakeholder Conversations.</p>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setActiveId(null);
          }}
          className="w-auto"
        >
          <TabsList className="bg-muted/50 border-none">
            <TabsTrigger value="all" className="text-xs gap-2">
              <List className="h-3 w-3" /> All Inbox
            </TabsTrigger>
            <TabsTrigger value="employers" className="text-xs gap-2">
              <MessageSquare className="h-3 w-3" /> Employers
            </TabsTrigger>
            <TabsTrigger value="talents_unmatched" className="text-xs gap-2">
              <ShieldAlert className="h-3 w-3" /> Talents / Unmatched
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs gap-2">
              <Users className="h-3 w-3" /> Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 overflow-hidden">
        {/* Sidebar: Conversation List */}
        <Card className="flex flex-col border-muted/40 shadow-sm overflow-hidden">
          <ScrollArea className="flex-1">
            {loadingConvs ? (
              <div className="p-10 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-10 text-center text-xs text-muted-foreground">No conversations in this view.</div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left p-3 border-b transition-colors hover:bg-muted/30 ${activeId === c.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">
                      {c.peer_display_name || c.peer_handle || "Unknown Sender"}
                    </span>
                    {c.unread_count > 0 && <Badge className="h-4 px-1.5 text-[10px]">{c.unread_count}</Badge>}
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge
                      variant="outline"
                      className="text-[9px] uppercase tracking-tighter px-1 h-3.5 border-muted-foreground/30"
                    >
                      {c.messaging_channels?.agent_key === "talent-outreach" ? "Talent Line" : "Employer Line"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {c.last_message_preview || "No message history"}
                  </p>
                </button>
              ))
            )}
          </ScrollArea>
        </Card>

        {/* Chat Thread */}
        <Card className="flex flex-col border-muted/40 shadow-sm overflow-hidden">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
              <Phone className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs">Select a secure thread to view activity</p>
            </div>
          ) : (
            <>
              <div className="p-3 border-b bg-muted/10 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{active.peer_display_name || active.peer_handle}</div>
                  <div className="text-[10px] text-muted-foreground font-mono">{active.external_chat_id}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="takeover" className="text-[11px] font-medium">
                      Human Takeover
                    </Label>
                    <Switch id="takeover" checked={active.auto_reply_paused} onCheckedChange={toggleHumanTakeover} />
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm shadow-sm ${
                        m.direction === "out"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted/30 border border-muted/40 rounded-tl-none"
                      }`}
                    >
                      {m.author === "agent" && (
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1.5">
                          <Bot className="h-3 w-3" /> AI Workforce
                        </div>
                      )}
                      {m.author === "human_operator" && m.direction === "out" && (
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1.5">
                          <User className="h-3 w-3" /> Admin
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</div>
                      <div
                        className={`text-[9px] opacity-50 mt-2 font-mono ${m.direction === "out" ? "text-right" : "text-left"}`}
                      >
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t bg-muted/5 flex gap-2">
                <Input
                  className="bg-background border-muted-foreground/20"
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Draft your response..."
                  disabled={sending}
                />
                <Button onClick={send} disabled={sending || !composer.trim()} className="shadow-md">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
