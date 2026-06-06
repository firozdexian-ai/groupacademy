import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useTalent } from "@/hooks/useTalent";
import { useAgentChat } from "@/domains/agents/hooks/useAgentChat";
import { useMessageThreads } from "@/domains/messaging/hooks/useMessageThreads";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/domains/messaging/components/talent/ChatBubble";
import { ArrowLeft, Bot, Sparkles, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PAGE_SHELL } from "@/lib/uiTokens";
import { listTalentSystemFeedNotifications } from "@/domains/talent/repo/talentRepo";
import { getAgentByKey } from "@/domains/agents/repo/agentsRepo";
import { getMessageThreadIdByTalentAndAgent, ensureSystemThread } from "@/domains/messaging/repo/messagingRepo";
import { InlineSpinner } from "@/components/common/InlineSpinner";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface NotificationRecord {
 id: string;
 title: string;
 message: string | null;
 link: string | null;
 created_at: string;
}

interface AgentRecord {
 id: string;
 name: string;
 agent_key: string;
 avatar_url: string | null;
 bg_color: string;
}

/**
 * GroUp Academy: Unified Thread Viewport (MessageThread)
 * Hardened responsive chat orchestrator managing dual-stream (System/Agent) communication pipelines.
 * Version: Launch Candidate · Phase Z1 Production Contract Sealed
 */
export default function MessageThread() {
 const { threadKey } = useParams<{ threadKey: string }>();
 const navigateHook = useNavigate();
 const { talent } = useTalent();
 const { markThreadRead } = useMessageThreads();

 const isSystemThread = threadKey === "system";
 const scrollContainerRef = React.useRef<HTMLDivElement>(null);

 // --- Agent State ---
 const { messages, isStreaming, sendMessage, startOrResumeSession, perResponseCost } = useAgentChat();
 const [activeAgent, setActiveAgent] = React.useState<AgentRecord | null>(null);
 const [textComposerInput, setTextComposerInput] = React.useState<string>("");
 const [isBootstrapping, setIsBootstrapping] = React.useState<boolean>(true);

 // --- System State ---
 const [systemNotifications, setSystemNotifications] = React.useState<NotificationRecord[]>([]);

 // =========================================================================
 // LIFECYCLE SECTOR: THREAD INGRESS PROTOCOL
 // =========================================================================
 React.useEffect(() => {
 if (!talent?.id || !threadKey) return;

 if (isSystemThread) {
 const loadSystemFeed = async () => {
 const tid = await ensureSystemThread(talent.id);
 if (tid) markThreadRead(tid);

 const data = await listTalentSystemFeedNotifications(talent.id, 200);
 setSystemNotifications(data ?? []);
 setIsBootstrapping(false);
 };
 void loadSystemFeed();
 } else {
 const loadAgentSession = async () => {
 setIsBootstrapping(true);
 const data = await getAgentByKey(threadKey);
 if (data) setActiveAgent(data as unknown as AgentRecord);
 await startOrResumeSession(threadKey);

 const threadId = await getMessageThreadIdByTalentAndAgent(talent.id, threadKey);
 if (threadId) markThreadRead(threadId);
 setIsBootstrapping(false);
 };
 void loadAgentSession();
 }
 }, [threadKey, isSystemThread, talent?.id, markThreadRead, startOrResumeSession]);

 // Sync scroll-to-bottom anchor
 React.useEffect(() => {
 if (scrollContainerRef.current) {
 scrollContainerRef.current.scrollTo({
 top: scrollContainerRef.current.scrollHeight,
 behavior: "smooth",
 });
 }
 }, [messages, systemNotifications]);

 const handleDispatchMessage = async () => {
 const trimmedInput = textComposerInput.trim();
 if (!trimmedInput || isStreaming) return;
 setTextComposerInput("");
 await sendMessage(trimmedInput);
 };

 const headerLabel = isSystemThread ? "System Notifications" : (activeAgent?.name ?? "Assistant");

 return (
 <div className={cn(PAGE_SHELL, "flex flex-col h-[100dvh] max-w-2xl mx-auto bg-background")}>
 {/* HUD LEVEL 1: CONTEXT HEADER */}
 <header className="sticky top-0 z-20 bg-background/95 border-b border-border/40 flex items-center gap-3 px-4 py-3">
 <Button variant="ghost" size="icon" aria-label="Go back" className="h-9 w-9 shrink-0" onClick={() => navigateHook("/app/messages")}>
 <ArrowLeft className="h-5 w-5" />
 </Button>

 <Avatar className="h-9 w-9 rounded-full shrink-0">
 {activeAgent?.avatar_url && <AvatarImage src={activeAgent.avatar_url} />}
 <AvatarFallback className="text-white" style={{ backgroundColor: activeAgent?.bg_color ?? "#2A7DDE" }}>
 {isSystemThread ? <Sparkles className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
 </AvatarFallback>
 </Avatar>

 <div className="flex-1 min-w-0">
 <p className="font-bold text-sm truncate">{headerLabel}</p>
 <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest truncate">
 {isSystemThread
 ? "System Feed"
 : isStreaming
 ? "Typing..."
 : `${perResponseCost} credits per message`}
 </p>
 </div>
 </header>

 {/* HUD LEVEL 2: MESSAGING VIEWPORT */}
 <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 bg-muted/10 space-y-4">
 {isBootstrapping ? (
 <InlineSpinner size="lg" />
 ) : isSystemThread ? (
 systemNotifications.length === 0 ? (
 <div className="text-center text-xs text-muted-foreground py-10">No system messages.</div>
 ) : (
 systemNotifications.map((n) => (
 <ChatBubble
 key={n.id}
 role="assistant"
 content={`${n.title}${n.message ? `\n\n${n.message}` : ""}`}
 timestamp={format(new Date(n.created_at), "MMM d, h:mm a")}
 ctaLabel={n.link ? "View" : undefined}
 ctaLink={n.link || undefined}
 />
 ))
 )
 ) : (
 <>
 {messages.map((m, i) => (
 <ChatBubble key={i} role={m.role} content={m.content} />
 ))}
 {isStreaming && (
 <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase font-bold text-muted-foreground animate-pulse">
 <InlineSpinner size="sm" /> {headerLabel} is typing...
 </div>
 )}
 </>
 )}
 </div>

 {/* HUD LEVEL 3: INPUT COMPOSER */}
 {!isSystemThread && (
 <div className="border-t border-border/40 bg-background p-4 flex gap-2">
 <Input
 placeholder={`Message ${headerLabel}...`}
 value={textComposerInput}
 onChange={(e) => setTextComposerInput(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleDispatchMessage()}
 className="h-11 rounded-xl bg-muted/30 border-transparent focus-visible:bg-background"
 disabled={isStreaming || isBootstrapping}
 />
 <Button
 size="icon" aria-label="Send"
 className="h-11 w-11 rounded-xl shrink-0"
 onClick={handleDispatchMessage}
 disabled={!textComposerInput.trim() || isStreaming}
 >
 <Send className="h-4 w-4" />
 </Button>
 </div>
 )}
 </div>
 );
}
