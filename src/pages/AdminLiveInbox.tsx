/**
 * Mission Control — Live Agent Inbox.
 *
 * Unified two-pane view over `agent_threads` (canonical AI thread store).
 * Admins can pause an AI thread, take it over, and reply on the agent's
 * behalf. Replies are inserted into `agent_messages` with role='assistant'
 * and prefixed with the admin's display name so downstream consumers see
 * the human handoff inline.
 */
import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ChatBubble } from "@/components/messages/ChatBubble";
import { Bot, Send, ShieldCheck, MessageSquare, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type ThreadStatus = "ai" | "human" | "closed";

interface Thread {
  id: string;
  agent_key: string | null;
  instance_id: string | null;
  subject_kind: string | null;
  subject_id: string | null;
  title: string | null;
  last_message_at: string | null;
  unread_count: number | null;
  status: ThreadStatus;
  human_takeover_at: string | null;
  assigned_admin_id: string | null;
}

interface Message {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  created_at: string;
}

const PAGE_SIZE = 80;

export default function AdminLiveInbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "ai" | "human">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const adminName = useMemo(
    () => (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0] || "Admin",
    [user],
  );

  // ── Threads: initial load + realtime ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingThreads(true);
      const { data, error } = await supabase
        .from("agent_threads")
        .select(
          "id, agent_key, instance_id, subject_kind, subject_id, title, last_message_at, unread_count, status, human_takeover_at, assigned_admin_id",
        )
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(PAGE_SIZE);
      if (!cancelled) {
        if (error) toast.error(`Failed to load threads: ${error.message}`);
        setThreads(((data as any) || []) as Thread[]);
        setLoadingThreads(false);
      }
    })();

    const ch = supabase
      .channel("admin-live-inbox-threads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agent_threads" },
        (payload) => {
          setThreads((prev) => {
            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== (payload.old as any).id);
            }
            const row = payload.new as Thread;
            const idx = prev.findIndex((t) => t.id === row.id);
            const next = idx >= 0 ? [...prev] : [row, ...prev];
            if (idx >= 0) next[idx] = { ...next[idx], ...row };
            return next.sort((a, b) =>
              (b.last_message_at ?? "").localeCompare(a.last_message_at ?? ""),
            );
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  // ── Messages for active thread + realtime ────────────────────────────────
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMsgs(true);
      const { data, error } = await supabase
        .from("agent_messages")
        .select("id, thread_id, role, content, created_at")
        .eq("thread_id", activeId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (!cancelled) {
        if (error) toast.error(`Failed to load messages: ${error.message}`);
        setMessages(((data as any) || []) as Message[]);
        setLoadingMsgs(false);
      }
    })();

    const ch = supabase
      .channel(`admin-live-inbox-msgs-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_messages",
          filter: `thread_id=eq.${activeId}`,
        },
        (payload) => {
          setMessages((prev) => {
            const row = payload.new as Message;
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, [activeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const active = threads.find((t) => t.id === activeId) || null;
  const filtered = useMemo(() => {
    if (filter === "all") return threads;
    return threads.filter((t) => t.status === filter);
  }, [threads, filter]);

  const counts = useMemo(
    () => ({
      ai: threads.filter((t) => t.status === "ai").length,
      human: threads.filter((t) => t.status === "human").length,
      total: threads.length,
    }),
    [threads],
  );

  // ── Takeover toggle ──────────────────────────────────────────────────────
  const toggleTakeover = async (next: boolean) => {
    if (!active || !user) return;
    const patch = next
      ? { status: "human" as ThreadStatus, human_takeover_at: new Date().toISOString(), assigned_admin_id: user.id }
      : { status: "ai" as ThreadStatus, human_takeover_at: null, assigned_admin_id: null };
    const prev = { ...active };
    setThreads((ts) => ts.map((t) => (t.id === active.id ? { ...t, ...patch } : t)));
    const { error } = await supabase.from("agent_threads").update(patch).eq("id", active.id);
    if (error) {
      setThreads((ts) => ts.map((t) => (t.id === active.id ? prev : t)));
      toast.error(`Takeover failed: ${error.message}`);
    } else {
      toast.success(next ? "AI paused — you're driving this thread" : "Returned thread to AI");
    }
  };

  // ── Admin send ───────────────────────────────────────────────────────────
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!active || !user || !draft.trim() || sending) return;
    if (active.status !== "human") {
      toast.error("Pause AI first to send as the agent.");
      return;
    }
    setSending(true);
    const body = `[${adminName}]: ${draft.trim()}`;
    const { error } = await supabase.from("agent_messages").insert({
      thread_id: active.id,
      role: "assistant",
      content: body,
    });
    if (error) {
      toast.error(`Send failed: ${error.message}`);
    } else {
      // Bump thread.last_message_at so list re-orders.
      await supabase
        .from("agent_threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", active.id);
      setDraft("");
    }
    setSending(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b border-border/40 px-6 flex items-center gap-3 bg-card/40 backdrop-blur flex-shrink-0">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="font-bold text-sm">Live Agent Inbox</div>
          <div className="text-[11px] text-muted-foreground">
            {counts.total} threads · {counts.ai} AI · {counts.human} human
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* LEFT — thread list */}
        <aside className="w-full md:w-[360px] border-r border-border/40 bg-card/30 flex flex-col flex-shrink-0">
          <div className="p-3 flex gap-2 border-b border-border/30">
            {(["all", "ai", "human"] as const).map((k) => (
              <Button
                key={k}
                size="sm"
                variant={filter === k ? "default" : "outline"}
                className="h-7 text-xs capitalize"
                onClick={() => setFilter(k)}
              >
                {k}
                <span className="ml-1.5 text-[10px] opacity-70">
                  {k === "all" ? counts.total : k === "ai" ? counts.ai : counts.human}
                </span>
              </Button>
            ))}
          </div>
          <ScrollArea className="flex-1">
            {loadingThreads ? (
              <div className="p-6 flex items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading threads…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                No threads in this view.
              </div>
            ) : (
              <ul className="divide-y divide-border/30">
                {filtered.map((t) => {
                  const isActive = t.id === activeId;
                  const subject = t.title || t.subject_id?.slice(0, 8) || "Untitled thread";
                  const agent = t.agent_key || t.instance_id?.slice(0, 8) || "agent";
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => setActiveId(t.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-accent/40 transition-colors",
                          isActive && "bg-accent/60",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold truncate">{subject}</span>
                          <Badge
                            variant={t.status === "human" ? "default" : "secondary"}
                            className="text-[10px] h-5 capitalize flex-shrink-0"
                          >
                            {t.status === "human" ? (
                              <User className="h-3 w-3 mr-1" />
                            ) : (
                              <Bot className="h-3 w-3 mr-1" />
                            )}
                            {t.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span className="truncate">{agent}</span>
                          {t.last_message_at && (
                            <span className="flex-shrink-0 ml-2">
                              {formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </aside>

        {/* RIGHT — thread pane */}
        <main className="flex-1 min-w-0 flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select a thread to inspect or take over
            </div>
          ) : (
            <>
              <div className="h-14 border-b border-border/40 px-6 flex items-center justify-between bg-card/40 flex-shrink-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {active.title || `Thread ${active.id.slice(0, 8)}`}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {active.agent_key || "agent"} · subject {active.subject_kind || "—"} ·{" "}
                    {active.subject_id?.slice(0, 8) || "—"}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Label htmlFor="takeover" className="text-xs font-medium">
                    {active.status === "human" ? "Human in control" : "AI in control"}
                  </Label>
                  <Switch
                    id="takeover"
                    checked={active.status === "human"}
                    onCheckedChange={toggleTakeover}
                    disabled={active.status === "closed"}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-6 py-6 space-y-1">
                  {loadingMsgs ? (
                    <div className="flex items-center justify-center text-muted-foreground text-sm py-12">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-12">
                      No messages yet.
                    </div>
                  ) : (
                    messages.map((m) => (
                      <ChatBubble
                        key={m.id}
                        role={m.role === "tool" ? "system" : (m.role as "user" | "assistant" | "system")}
                        content={m.content}
                        timestamp={new Date(m.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Composer */}
              {active.status === "human" ? (
                <form
                  onSubmit={handleSend}
                  className="border-t border-border/40 bg-card/40 p-4 flex items-center gap-2 flex-shrink-0"
                >
                  <Input
                    placeholder={`Reply as ${adminName}…`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={sending}
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" disabled={!draft.trim() || sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" /> Send
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <Card className="m-4 p-3 flex items-center gap-3 text-xs text-muted-foreground bg-muted/30 border-dashed flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                  <span>
                    AI is currently handling this thread. Toggle <strong>Human in control</strong>{" "}
                    above to pause the agent and reply directly.
                  </span>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
