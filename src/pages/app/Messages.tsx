import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageCircle, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreadListItem } from "@/components/messages/ThreadListItem";
import { useMessageThreads } from "@/hooks/useMessageThreads";
import { cn } from "@/lib/utils";

/**
 * Messenger Inbox — WhatsApp-style unified chat list.
 * Every notification + agent conversation appears here as a thread.
 */
export default function Messages() {
  const navigate = useNavigate();
  const { threads, isLoading } = useMessageThreads();
  const [filter, setFilter] = useState<"all" | "unread" | "agents" | "system">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = threads;
    if (filter === "unread") list = list.filter((t) => t.unread_count > 0);
    if (filter === "agents") list = list.filter((t) => t.thread_type === "agent");
    if (filter === "system") list = list.filter((t) => t.thread_type === "system");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (t.agentName || "").toLowerCase().includes(q) ||
          (t.last_message_preview || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [threads, filter, search]);

  const filterChips: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "agents", label: "Agents" },
    { id: "system", label: "System" },
  ];

  const goToThread = (t: (typeof threads)[number]) => {
    if (t.thread_type === "system") navigate(`/app/messages/system`);
    else navigate(`/app/messages/${t.agent_key}`);
  };

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold tracking-tight">Messages</h1>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => navigate("/app/agents")}
          >
            <Bot className="h-3.5 w-3.5" /> Discover Agents
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 bg-muted/40 border-none"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {filterChips.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "shrink-0 px-3 h-7 rounded-full text-xs font-semibold transition-colors",
                filter === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      {/* List */}
      <div>
        {isLoading ? (
          <div className="space-y-px">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center mb-4">
              <MessageCircle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold mb-1">No conversations</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Visit the Agent Marketplace to start chatting with an AI agent.
            </p>
            <Button onClick={() => navigate("/app/agents")} className="gap-2">
              <Bot className="h-4 w-4" /> Browse Agents
            </Button>
          </div>
        ) : (
          filtered.map((t) => <ThreadListItem key={t.id} thread={t} onClick={() => goToThread(t)} />)
        )}
      </div>
    </div>
  );
}
