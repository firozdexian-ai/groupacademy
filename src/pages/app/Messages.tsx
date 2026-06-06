import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Bot, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThreadListItem } from "@/domains/messaging/components/talent/ThreadListItem";
import { useMessageThreads } from "@/domains/messaging/hooks/useMessageThreads";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface MessageThread {
 id: string;
 agentName?: string | null;
 agent_key: string | null;
 thread_type: "agent" | "system" | string;
 last_message_preview: string | null;
 unread_count: number;
 updated_at?: string;
 last_message_at?: string;
}

type FilterKey = "all" | "unread" | "agents" | "system";

const FILTER_CONFIG: { id: FilterKey; label: string }[] = [
 { id: "all", label: "All" },
 { id: "unread", label: "Unread" },
 { id: "agents", label: "Agents" },
 { id: "system", label: "System" },
];

/**
 * GroUp Academy: Unified Messenger Inbox
 * Hardened responsive communication center with filtered thread ingestion.
 * Version: Launch Candidate · Phase Z1 Production Contract Sealed
 */
export default function Messages() {
 const navigateHook = useNavigate();
 const { threads = [], isLoading: isRegistryLoading } = useMessageThreads();

 const [activeFilterKey, setActiveFilterKey] = React.useState<FilterKey>("all");
 const [textSearchQueryStr, setTextSearchInputStr] = React.useState<string>("");

 // =========================================================================
 // MEMOIZED PARAMETER SECTOR: O(n) FILTERING & SEARCH
 // =========================================================================
 const filteredThreadsList = React.useMemo(() => {
 const normalizedQuery = textSearchQueryStr.trim().toLowerCase();

 return threads.filter((t) => {
 const matchesFilter =
 activeFilterKey === "all"
 ? true
 : activeFilterKey === "unread"
 ? t.unread_count > 0
 : t.thread_type === activeFilterKey;

 const matchesSearch =
 !normalizedQuery ||
 t.agentName?.toLowerCase().includes(normalizedQuery) ||
 t.last_message_preview?.toLowerCase().includes(normalizedQuery);

 return matchesFilter && matchesSearch;
 });
 }, [threads, activeFilterKey, textSearchQueryStr]);

 const handleNavigateToThread = React.useCallback(
 (thread: MessageThread) => {
 if (thread.thread_type === "system") {
 navigateHook("/app/messages/system");
 } else if (thread.agent_key) {
 navigateHook(`/app/messages/${thread.agent_key}`);
 }
 },
 [navigateHook],
 );

 return (
 <div className="max-w-2xl mx-auto pb-24 antialiased block transform-gpu w-full">
 {/* HUD LEVEL 1: MESSENGER COMMAND HEADER */}
 <header className="sticky top-0 z-30 bg-background/95 border-b border-border/40 px-4 py-3 space-y-3">
 <div className="flex items-center justify-between gap-4">
 <h1 className="text-xl font-black uppercase tracking-tight text-foreground">Messenger</h1>
 <Button
 size="sm"
 variant="outline"
 className="h-8 text-xs font-medium tracking-widest gap-2 shadow-xs"
 onClick={() => navigateHook("/app/agents")}
 >
 <Bot className="h-3.5 w-3.5" /> Discovery
 </Button>
 </div>

 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
 <Input
 placeholder="Search messages..."
 value={textSearchQueryStr}
 onChange={(e) => setTextSearchInputStr(e.target.value)}
 className="h-9 pl-9 bg-muted/30 border-transparent focus-visible:bg-background rounded-lg shadow-none text-xs"
 />
 </div>

 <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
 {FILTER_CONFIG.map((chip) => (
 <button
 key={`filter-chip-${chip.id}`}
 onClick={() => setActiveFilterKey(chip.id)}
 className={cn(
 "shrink-0 px-4 h-7 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
 activeFilterKey === chip.id
 ? "bg-primary text-primary-foreground shadow-xs"
 : "bg-muted/50 text-muted-foreground hover:bg-muted",
 )}
 >
 {chip.label}
 </button>
 ))}
 </div>
 </header>

 {/* HUD LEVEL 2: THREAD LISTING VIEWPORT */}
 <main className="mt-2 block w-full">
 {isRegistryLoading ? (
 <div className="space-y-px">
 {[...Array(6)].map((_, i) => (
 <div key={`skeleton-row-${i}`} className="flex items-center gap-4 px-4 py-4">
 <Skeleton className="h-12 w-12 rounded-full shrink-0 bg-muted/60" />
 <div className="flex-1 space-y-2">
 <Skeleton className="h-3 w-32 bg-muted/60" />
 <Skeleton className="h-3 w-48 bg-muted/40" />
 </div>
 </div>
 ))}
 </div>
 ) : filteredThreadsList.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in duration-300">
 <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
 <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
 </div>
 <h2 className="text-sm font-bold uppercase tracking-tight mb-2">No messages found</h2>
 <p className="text-xs text-muted-foreground mb-6 max-w-[200px]">
 Start a conversation with an AI agent to see your chats here.
 </p>
 <Button
 onClick={() => navigateHook("/app/agents")}
 size="sm"
 className="gap-2 text-xs font-bold uppercase tracking-widest rounded-lg"
 >
 <Bot className="h-4 w-4" /> Browse Agents
 </Button>
 </div>
 ) : (
 <div className="animate-in fade-in duration-200">
 {filteredThreadsList.map((thread) => (
 <ThreadListItem
 key={`thread-item-${thread.id}`}
 thread={thread}
 onClick={() => handleNavigateToThread(thread)}
 />
 ))}
 </div>
 )}
 </main>
 </div>
 );
}
