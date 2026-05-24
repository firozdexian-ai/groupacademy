import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft, Send, Loader2, Bot, Info, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAIGeneralChat } from "@/hooks/useAIGeneralChat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
 id?: string;
 role: "user" | "assistant" | "system";
 content: string;
 timestamp?: string;
}

/**
 * GroUp Academy: Technical Neural Concierge Interface (AIGeneral)
 * Hardened fixed-viewport chat platform anchoring fluid streaming threads and insulating lifecycle scroll parameters.
 * Version: Launch Candidate · Phase Z1 Viewport Containment Locked
 */
export default function AIGeneral() {
 const [urlSearchParamsMap] = useSearchParams();
 const executeNavigationHook = useNavigate();
 const extractedQueryParameterStr = urlSearchParamsMap.get("q") || undefined;

 const {
 messages: rawMessagesPayload,
 isStreaming,
 isLoading,
 sendMessage,
 } = useAIGeneralChat(extractedQueryParameterStr);
 const [textConsoleInput, setTextConsoleInput] = React.useState<string>("");
 const viewportScrollAnchorRef = React.useRef<HTMLDivElement>(null);

 // Cast background datasets to explicit type structures ahead of rendering blocks
 const typedMessagesRoster = rawMessagesPayload as unknown as ChatMessage[];

 // =========================================================================
 // LIFECYCLE SECTOR 1: HARDWARE-ACCELERATED ANIMATION SCROLL ANCHORING
 // =========================================================================
 React.useEffect(() => {
 let frameworkAnimationFrameRequestToken: number;

 const executeSymmetricScrollRepositioning = () => {
 if (viewportScrollAnchorRef.current) {
 viewportScrollAnchorRef.current.scrollIntoView({ behavior: "smooth" });
 }
 };

 // Replace loose timeouts with a hardware-synced requestAnimationFrame pipeline
 frameworkAnimationFrameRequestToken = requestAnimationFrame(executeSymmetricScrollRepositioning);

 return () => {
 cancelAnimationFrame(frameworkAnimationFrameRequestToken);
 };
 }, [typedMessagesRoster.length, isStreaming]);

 // =========================================================================
 // ACTION HOOKS: TRANSACTION SUBMISSION TIMELINES
 // =========================================================================
 const handleMessageDispatchSequence = async (eventFormContext: React.FormEvent) => {
 eventFormContext.preventDefault();
 if (!textConsoleInput.trim() || isStreaming || isLoading) return;

 const capturedConsoleInputStr = textConsoleInput;
 setTextConsoleInput("");

 try {
 await sendMessage(capturedConsoleInputStr);
 } catch (suppressedMutationException) {
 // Shield runtime chat threads from terminal connection drops
 }
 };

 const handleReturnHistorySequence = React.useCallback(() => {
 executeNavigationHook(-1);
 }, [executeNavigationHook]);

 return (
 <div className="max-w-4xl mx-auto h-[calc(100vh-145px)] md:h-[calc(100vh-80px)] flex flex-col bg-background overflow-hidden md:border-x border-border/40 shadow-none text-left antialiased transform-gpu w-full">
 {/* HUD LEVEL 1: APP SHELL HUD HEADER IDENTITY CONTEXT */}
 <header className="flex items-center justify-between py-3.5 px-4 border-b border-border/40 bg-card shrink-0 z-20 select-none">
 <div className="flex items-center gap-3.5 min-w-0">
 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="h-9 w-9 rounded-lg transition-transform active:scale-95 cursor-pointer shrink-0"
 onClick={handleReturnHistorySequence}
 >
 <ArrowLeft className="h-4 w-4 stroke-[2.5]" />
 </Button>

 <div className="relative shrink-0 pointer-events-none">
 <div className="absolute inset-0 bg-emerald-500/10 rounded-lg blur-md animate-pulse" />
 <Avatar className="h-10 w-10 rounded-lg border border-emerald-500/20 shadow-none">
 <AvatarFallback className="bg-linear-to-tr from-emerald-600 to-teal-700 rounded-none block grid place-items-center w-full h-full">
 <Bot className="h-5 w-5 text-white stroke-[2]" />
 </AvatarFallback>
 </Avatar>
 <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full shadow-2xs block" />
 </div>

 <div className="min-w-0 leading-none space-y-0.5">
 <h1 className="font-bold text-sm sm:text-base uppercase tracking-wide text-foreground truncate block">
 AI Concierge Operator
 </h1>
 <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground/50 leading-none">
 <span className="flex items-center gap-1 text-emerald-600">
 <div className="h-1 w-1 rounded-full bg-current animate-ping" />
 <span>Uplink Active</span>
 </span>
 <span className="opacity-20 select-none">•</span>
 <span className="flex items-center gap-1">
 <Zap className="h-3 w-3 stroke-[2]" />
 <span>Standard Tier</span>
 </span>
 </div>
 </div>
 </div>

 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="h-8 w-8 rounded-lg opacity-40 hover:opacity-100 cursor-pointer transition-opacity shrink-0"
 >
 <Info className="h-4 w-4 stroke-[2]" />
 </Button>
 </header>

 {/* HUD LEVEL 2: DYNAMIC CHAT STREAM CONTEXT DISPATCH VIEWPORT */}
 <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-none transform-gpu block w-full">
 {isLoading && typedMessagesRoster.length === 0 && (
 <div className="flex flex-col items-center justify-center h-full space-y-3 select-none pointer-events-none">
 <Loader2 className="h-6 w-6 animate-spin text-primary opacity-25 stroke-[2]" />
 <p className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/40 animate-pulse">
 Initializing AI Core Link...
 </p>
 </div>
 )}

 {/* Empty State Profile Indicator */}
 {!isLoading && typedMessagesRoster.length === 0 && (
 <div className="flex flex-col items-center justify-center h-full text-center select-none pointer-events-none max-w-xs mx-auto space-y-4 leading-none">
 <div className="relative shrink-0 block">
 <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
 <div className="relative h-16 w-16 rounded-xl bg-linear-to-br from-primary to-blue-700 flex items-center justify-center shadow-md rotate-3">
 <Sparkles className="h-8 w-8 text-white animate-pulse stroke-[1.8]" />
 </div>
 </div>
 <div className="space-y-1 block leading-none">
 <h2 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
 Concierge Core Matrix Online
 </h2>
 <p className="font-mono text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider leading-normal">
 Platform interface operational. Submit programmatic inputs for academic paths, validation logic, or
 deployment indices.
 </p>
 </div>
 </div>
 )}

 {/* Unified Message Iteration Block */}
 {typedMessagesRoster.map((messageNodeItem, arrayIndexPosition) => {
 const isAssistantNode = messageNodeItem.role === "assistant";
 const uniqueRowAnchorKey = messageNodeItem.id || `general-msg-node-${arrayIndexPosition}`;

 return (
 <div
 key={uniqueRowAnchorKey}
 className={cn(
 "flex gap-3 leading-none w-full block animate-in fade-in duration-200",
 messageNodeItem.role === "user" ? "justify-end" : "justify-start",
 )}
 >
 {isAssistantNode && (
 <Avatar className="h-8 w-8 rounded-md border border-border/40 bg-background text-xs shrink-0 select-none pointer-events-none shadow-2xs mt-0.5">
 <AvatarFallback className="bg-muted rounded-none block grid place-items-center w-full h-full">
 <Bot className="h-4 w-4 text-primary stroke-[2.2]" />
 </AvatarFallback>
 </Avatar>
 )}

 <div
 className={cn(
 "max-w-[85%] rounded-xl px-4 py-2.5 shadow-none transition-colors font-medium text-xs sm:text-sm leading-relaxed block select-text",
 messageNodeItem.role === "user"
 ? "bg-primary text-primary-foreground rounded-tr-none font-bold"
 : "bg-card text-foreground rounded-tl-none border border-border/60",
 )}
 >
 {isAssistantNode ? (
 <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm font-medium leading-relaxed tracking-normal select-text space-y-2 block">
 <ReactMarkdown
 components={{
 a: ({ href, children }) => (
 <a
 href={href}
 rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
 target={href?.startsWith("http") ? "_blank" : undefined}
 className="text-primary font-bold hover:underline"
 onClick={(clickEventObj) => {
 if (href?.startsWith("/")) {
 clickEventObj.preventDefault();
 executeNavigationHook(href);
 }
 }}
 >
 {children}
 </a>
 ),
 }}
 >
 {messageNodeItem.content || "..."}
 </ReactMarkdown>
 </div>
 ) : (
 <p className="whitespace-pre-wrap leading-relaxed block tracking-normal select-text font-semibold">
 {messageNodeItem.content}
 </p>
 )}
 </div>
 </div>
 );
 })}

 {/* Dynamic Chunk Streaming Activity Loader */}
 {isStreaming && typedMessagesRoster[typedMessagesRoster.length - 1]?.role === "user" && (
 <div className="flex gap-3 justify-start items-center select-none pointer-events-none block animate-pulse">
 <div className="h-8 w-8 rounded-md bg-muted border border-border/40 flex items-center justify-center shrink-0 block">
 <Loader2 className="h-4 w-4 animate-spin text-primary opacity-40" />
 </div>
 <div className="bg-muted/40 h-8 w-20 rounded-xl rounded-tl-none block border border-border/5" />
 </div>
 )}

 <div ref={viewportScrollAnchorRef} className="h-2 block shrink-0 select-none pointer-events-none" />
 </main>

 {/* HUD LEVEL 3: INPUT OPERATIONAL TEXT CONSOLE PANEL */}
 <footer className="shrink-0 border-t border-border/40 bg-card p-4 select-none">
 <form
 onSubmit={handleMessageDispatchSequence}
 className="max-w-3xl mx-auto flex gap-2.5 leading-none w-full block"
 >
 <Input
 type="text"
 placeholder="Command concierge core infrastructure parameters..."
 value={textConsoleInput}
 onChange={(e) => setTextConsoleInput(e.target.value)}
 disabled={isStreaming || isLoading}
 className="flex-1 h-11 bg-background/50 border border-border/60 px-4 text-xs sm:text-sm font-semibold tracking-wide rounded-lg focus-visible:ring-1 focus-visible:ring-ring shadow-none"
 />
 <Button
 type="submit"
 size="icon"
 disabled={!textConsoleInput.trim() || isStreaming || isLoading}
 className="h-11 w-11 rounded-lg bg-primary shadow-2xs hover:bg-primary/90 cursor-pointer transition-transform transform-gpu active:scale-95 shrink-0 block"
 title="Dispatch telemetry block string"
 >
 <Send className="h-4 w-4 stroke-[2.5]" />
 </Button>
 </form>
 </footer>
 </div>
 );
}
