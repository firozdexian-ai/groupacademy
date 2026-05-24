import * as React from "react";
import { useParams } from "react-router-dom";
import { aiLanguagePartner } from "@/domains/abroad/api/abroadApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, Eye, EyeOff, Bot, User, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, CARD } from "@/lib/uiTokens";
import { InlineSpinner } from "@/components/common/InlineSpinner";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface Turn {
 role: "user" | "assistant";
 content: string;
 translation_en?: string;
}

interface Correction {
 original: string;
 corrected: string;
 explanation: string;
}

interface AIResponsePayload {
 reply: string;
 translation_en: string;
 corrections: Correction[];
 session_id: string;
 error?: string;
}

/**
 * GroUp Academy: AI Language Partner Workspace (LanguagePracticePage)
 * Hardened responsive chat interface synchronizing multi-modal language feedback and tracking session history securely.
 * Version: Launch Candidate · Phase Z1 Production Contract Locked
 */
export default function LanguagePracticePage() {
 const { code: languageCode = "en" } = useParams<{ code: string }>();

 const [activeCefrLevel, setActiveCefrLevel] = React.useState<string>("B1");
 const [conversationTurns, setConversationTurns] = React.useState<Turn[]>([]);
 const [activeCorrections, setActiveCorrections] = React.useState<Correction[]>([]);
 const [userTextInputStr, setUserTextInputStr] = React.useState<string>("");
 const [isInferenceProcessing, setIsInferenceProcessing] = React.useState<boolean>(false);
 const [isTranslationVisible, setIsTranslationVisible] = React.useState<boolean>(false);
 const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);

 const scrollViewportRef = React.useRef<HTMLDivElement>(null);

 // Auto-scroll viewport behavior anchored to message stream growth
 React.useEffect(() => {
 if (scrollViewportRef.current) {
 const scrollElement = scrollViewportRef.current;
 scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: "smooth" });
 }
 }, [conversationTurns]);

 const handleDispatchMessageSequence = React.useCallback(async () => {
 if (!userTextInputStr.trim() || isInferenceProcessing) return;

 const sanitizedText = userTextInputStr.trim();
 setUserTextInputStr("");
 setConversationTurns((prev) => [...prev, { role: "user", content: sanitizedText }]);
 setIsInferenceProcessing(true);

 try {
 const data = await aiLanguagePartner({
 language_code: languageCode.toUpperCase(),
 cefr_level: activeCefrLevel,
 message: sanitizedText,
 session_id: activeSessionId,
 });

 if (data?.error) throw new Error(data.error);

 if (data.session_id && !activeSessionId) setActiveSessionId(data.session_id);

 setConversationTurns((prev) => [
 ...prev,
 {
 role: "assistant",
 content: data.reply as string,
 translation_en: data.translation_en as string | undefined,
 },
 ]);

 if (Array.isArray(data.corrections) && data.corrections.length) {
 setActiveCorrections((prev) => [...prev, ...(data.corrections as Correction[])]);
 }
 } catch (e: any) {
 toast.error(e.message || "Failed to finalize communication channel.");
 } finally {
 setIsInferenceProcessing(false);
 }
 }, [userTextInputStr, isInferenceProcessing, activeCefrLevel, activeSessionId, languageCode]);

 const handleKeyboardInputInterceptor = React.useCallback(
 (e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Enter" && !e.shiftKey) {
 e.preventDefault();
 handleDispatchMessageSequence();
 }
 },
 [handleDispatchMessageSequence],
 );

 return (
 <div className={cn(PAGE_SHELL, "flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto")}>
 {/* HUD LEVEL 1: SESSION CONTEXT BAR */}
 <Card className="m-4 p-3 flex items-center gap-3 rounded-lg border border-border/60 bg-card/40 shadow-none">
 <div className="font-bold uppercase tracking-wider text-xs flex-1 text-primary">
 Practice {languageCode.toUpperCase()}
 </div>
 <select
 className="text-xs font-medium tracking-widest border border-border/60 rounded px-2 py-1 bg-background outline-none cursor-pointer"
 value={activeCefrLevel}
 onChange={(e) => setActiveCefrLevel(e.target.value)}
 >
 {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
 <option key={level} value={level}>
 {level}
 </option>
 ))}
 </select>
 <Button
 size="sm"
 variant="ghost"
 className="h-8 w-8 p-0"
 onClick={() => setIsTranslationVisible((v) => !v)}
 title="Toggle translation display"
 >
 {isTranslationVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
 </Button>
 </Card>

 {/* HUD LEVEL 2: MESSAGING LOG VIEWPORT */}
 <ScrollArea className="flex-1 px-4 block w-full" ref={scrollViewportRef}>
 <div className="space-y-4 pb-4">
 {conversationTurns.map((turn, index) => (
 <div
 key={`chat-turn-${index}`}
 className={cn("flex w-full", turn.role === "user" ? "justify-end" : "justify-start")}
 >
 <div
 className={cn(
 "rounded-lg px-4 py-3 max-w-[85%] text-sm shadow-3xs",
 turn.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60 border border-border/20",
 )}
 >
 <div className="leading-relaxed">
 <ReactMarkdown>{turn.content}</ReactMarkdown>
 </div>
 {isTranslationVisible && turn.translation_en && (
 <div className="text-[11px] mt-2 pt-2 border-t border-current/10 opacity-70 italic">
 {turn.translation_en}
 </div>
 )}
 </div>
 </div>
 ))}
 {isInferenceProcessing && (
 <div className="flex justify-start">
 <div className="rounded-lg px-4 py-3 bg-muted/60 text-muted-foreground border border-border/20">
 <InlineSpinner size="sm" />
 </div>
 </div>
 )}
 </div>
 </ScrollArea>

 {/* HUD LEVEL 3: CORRECTION LOGS OVERLAY */}
 {activeCorrections.length > 0 && (
 <Card className={cn(CARD, "mx-4 mb-2 p-3 max-h-40 overflow-y-auto border-amber-500/20 bg-amber-500/[0.02]")}>
 <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center justify-between sticky top-0 bg-inherit pb-1">
 <span>Correction Log</span>
 <button onClick={() => setActiveCorrections([])} className="hover:text-destructive transition-colors">
 <EyeOff className="h-3 w-3" />
 </button>
 </div>
 {activeCorrections.slice(-3).map((item, idx) => (
 <div key={`correction-node-${idx}`} className="text-xs mb-3 last:mb-0 border-l-2 border-primary/20 pl-2">
 <span className="line-through text-destructive/80 font-medium">{item.original}</span>
 <span className="mx-2 text-primary font-bold">→</span>
 <span className="text-emerald-700 font-bold">{item.corrected}</span>
 <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{item.explanation}</p>
 </div>
 ))}
 </Card>
 )}

 {/* HUD LEVEL 4: INTERACTION INPUT CONTROL PANEL */}
 <div className="p-3 border-t border-border/40 flex gap-2 sticky bottom-0 bg-background/95 backdrop-blur-sm z-20">
 <Input
 value={userTextInputStr}
 onChange={(e) => setUserTextInputStr(e.target.value)}
 onKeyDown={handleKeyboardInputInterceptor}
 placeholder="Input target language sequence..."
 disabled={isInferenceProcessing}
 className="rounded-lg h-10 shadow-none border-border/60"
 />
 <Button
 onClick={handleDispatchMessageSequence}
 disabled={isInferenceProcessing || !userTextInputStr.trim()}
 size="icon"
 className="rounded-lg shrink-0"
 >
 <Send className="h-4 w-4" />
 </Button>
 </div>
 </div>
 );
}
