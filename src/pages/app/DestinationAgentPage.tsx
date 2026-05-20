import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { aiDestinationAgent } from "@/domains/abroad/api/abroadApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Map, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { RoadmapBuilderSheet } from "@/components/abroad/RoadmapBuilderSheet";
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface DestinationAgentRecord {
  id: string;
  country_code: string;
  display_name: string;
  tagline: string | null;
  flag_emoji: string | null;
}

interface StudyAbroadProgramItem {
  id: string;
  university_name: string;
  program_name: string;
  degree_type: string | null;
  tuition_range: string | null;
}

interface AgentMessageNode {
  role: "user" | "assistant";
  content: string;
}

interface DatabaseMessageRow {
  role: string;
  content: string;
}

/**
 * GroUp Academy: AI Study Abroad Destination Advisor Interface (DestinationAgentPage)
 * Hardened conversation workspace orchestrating secure agent queries, tracking timeline histories, and anchoring scroll parameters.
 * Version: Launch Candidate · Phase Z1 Integration Stability Locked
 */
export default function DestinationAgentPage() {
  const { country: unverifiedCountryParamStr } = useParams<{ country: string }>();
  const validatedCountryCodeStr = React.useMemo<string>(() => {
    return (unverifiedCountryParamStr || "").toUpperCase();
  }, [unverifiedCountryParamStr]);

  const [chatMessagesList, setChatMessagesList] = React.useState<AgentMessageNode[]>([]);
  const [consoleTextInputStr, setConsoleTextInputStr] = React.useState<string>("");
  const [isAIEngineProcessing, setIsAIEngineProcessing] = React.useState<boolean>(false);

  const scrollContainerViewportRef = React.useRef<HTMLDivElement>(null);

  // =========================================================================
  // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
  // =========================================================================
  const { data: destinationAgentMetadata, isLoading: isAgentCacheResolving } = useQuery({
    queryKey: ["app-destination-agent-profile", validatedCountryCodeStr],
    queryFn: async (): Promise<DestinationAgentRecord> => {
      const { data: dbAgentPayload, error: queryHandshakeError } = await supabase
        .from("destination_agents")
        .select("id, country_code, display_name, tagline, flag_emoji")
        .eq("country_code", validatedCountryCodeStr)
        .maybeSingle();

      if (queryHandshakeError) throw queryHandshakeError;
      if (!dbAgentPayload) throw new Error("Target destination profile parameters unallocated.");
      return dbAgentPayload as unknown as DestinationAgentRecord;
    },
    enabled: !!validatedCountryCodeStr,
  });

  const { data: availableProgramsCollection = [] } = useQuery({
    queryKey: ["app-study-abroad-programs-index", validatedCountryCodeStr],
    queryFn: async (): Promise<StudyAbroadProgramItem[]> => {
      const { data: dbProgramsPayload, error: queryHandshakeError } = await supabase
        .from("study_abroad_programs")
        .select("id, university_name, program_name, degree_type, tuition_range")
        .eq("country_code", validatedCountryCodeStr)
        .eq("is_active", true)
        .limit(10);

      if (queryHandshakeError) throw queryHandshakeError;
      return (dbProgramsPayload as unknown as StudyAbroadProgramItem[]) ?? [];
    },
    enabled: !!validatedCountryCodeStr,
  });

  // =========================================================================
  // LIFECYCLE SECTOR 1: INSULATED HISTORICAL LOG CONTEXT SYNCHRONIZATION
  // =========================================================================
  React.useEffect(() => {
    if (!validatedCountryCodeStr) return;

    let isThreadActive = true;
    const loadHistoricalMessagesTrack = async () => {
      try {
        const { data: dbMessagesPayload, error: queryHandshakeError } = await supabase
          .from("destination_agent_messages")
          .select("role, content")
          .eq("country_code", validatedCountryCodeStr)
          .order("created_at", { ascending: true })
          .limit(40);

        if (queryHandshakeError) throw queryHandshakeError;
        if (!isThreadActive) return;

        if (dbMessagesPayload && dbMessagesPayload.length > 0) {
          const castMessagesRows = dbMessagesPayload as unknown as DatabaseMessageRow[];
          const sanitizedMessages: AgentMessageNode[] = castMessagesRows.map((rowItem) => ({
            role: rowItem.role === "tool" ? "assistant" : (rowItem.role as "user" | "assistant"),
            content: rowItem.content,
          }));
          setChatMessagesList(sanitizedMessages);
        } else {
          setChatMessagesList([]);
        }
      } catch (fatalHandshakeException) {
        console.error("Historical Telemetry Synchronization Failure:", fatalHandshakeException);
      }
    };

    loadHistoricalMessagesTrack();

    return () => {
      isThreadActive = false;
    };
  }, [validatedCountryCodeStr]);

  // Force downstream fluid scroll corrections securely on message payload state shifts
  React.useEffect(() => {
    if (scrollContainerViewportRef.current) {
      const scrollElement = scrollContainerViewportRef.current;
      // Access sub-inner view viewport properties safely via standard DOM definitions
      const innerScrollAreaViewport = scrollElement.querySelector("[data-radix-scroll-area-viewport]");
      if (innerScrollAreaViewport) {
        innerScrollAreaViewport.scrollTo({
          top: innerScrollAreaViewport.scrollHeight,
          behavior: "smooth",
        });
      }
    }
  }, [chatMessagesList, isAIEngineProcessing]);

  // =========================================================================
  // ACTION HOOKS: INFERENCE TRANSMISSION DISPATCH SEQUENCE ACTIONS
  // =========================================================================
  const handleDispatchConsoleQuerySequence = React.useCallback(async () => {
    if (!consoleTextInputStr.trim() || isAIEngineProcessing) return;

    const sanitizedUserInputText = consoleTextInputStr.trim();
    setConsoleTextInputStr("");

    setChatMessagesList((prevList) => [...prevList, { role: "user", content: sanitizedUserInputText }]);
    setIsAIEngineProcessing(true);

    try {
      const edgeFunctionResponsePayload = await aiDestinationAgent({
        country_code: validatedCountryCodeStr,
        message: sanitizedUserInputText,
        intent: "chat",
      });

      if (edgeFunctionResponsePayload?.error) throw new Error(edgeFunctionResponsePayload.error);

      if (edgeFunctionResponsePayload?.message) {
        setChatMessagesList((prevList) => [
          ...prevList,
          { role: "assistant", content: String(edgeFunctionResponsePayload.message) },
        ]);
      }
    } catch (fatalInferenceException: any) {
      toast.error(fatalInferenceException.message || "Asynchronous interaction framework connection timeout.");
    } finally {
      setIsAIEngineProcessing(false);
    }
  }, [consoleTextInputStr, isAIEngineProcessing, validatedCountryCodeStr]);

  const handleKeyboardInputInterceptor = React.useCallback(
    (eventObj: React.KeyboardEvent<HTMLInputElement>) => {
      if (eventObj.key === "Enter" && !eventObj.shiftKey) {
        eventObj.preventDefault();
        handleDispatchConsoleQuerySequence();
      }
    },
    [handleDispatchConsoleQuerySequence],
  );

  if (isAgentCacheResolving) {
    return (
      <div className="max-w-3xl mx-auto p-4 select-none pointer-events-none block w-full">
        <Skeleton className="h-28 w-full rounded-lg bg-card/20 block border border-transparent shadow-none" />
      </div>
    );
  }

  if (!destinationAgentMetadata) {
    return (
      <div
        role="alert"
        className="min-h-[40vh] grid place-items-center text-center p-6 antialiased select-none transform-gpu w-full"
      >
        <div className="max-w-xs block space-y-2 leading-none">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Destination Advisor Unmapped</p>
          <p className="text-[11px] font-semibold text-muted-foreground/50 leading-normal">
            The target location agent infrastructure profile metrics could not be resolved from study abroad registry
            files.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto text-left antialiased transform-gpu w-full">
      {/* HUD LEVEL 1: DESTINATION HUD TOP SUMMARY CAP SPEC MATRIX HEADER */}
      <Card className="m-4 p-3.5 rounded-lg border border-border/60 bg-card/40 flex items-center gap-3.5 select-none shrink-0 shadow-none overflow-hidden">
        <div className="text-3xl pointer-events-none shrink-0" role="img" aria-hidden="true">
          {destinationAgentMetadata.flag_emoji || "🌐"}
        </div>
        <div className="flex-1 min-w-0 leading-none space-y-1 block">
          <div className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground truncate block select-text pt-0.5">
            {destinationAgentMetadata.display_name}
          </div>
          {destinationAgentMetadata.tagline && (
            <p className="text-[11px] font-semibold text-muted-foreground/70 truncate block select-text pr-1">
              {destinationAgentMetadata.tagline}
            </p>
          )}
        </div>

        <div className="shrink-0 leading-none block">
          <RoadmapBuilderSheet countryCode={validatedCountryCodeStr}>
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-wide cursor-pointer shadow-2xs gap-1.5 pt-0.5"
            >
              <Map className="h-3.5 w-3.5 stroke-[2.2] shrink-0" /> <span>Syllabus Roadmap</span>
            </Button>
          </RoadmapBuilderSheet>
        </div>
      </Card>

      {/* HUD LEVEL 2: IMMERSIVE STREAM MESSAGING LOGS SCRIP LAUNCH CHANNELS */}
      <ScrollArea className="flex-1 px-4 block w-full overflow-y-auto" ref={scrollContainerViewportRef}>
        <div className="space-y-3 block w-full pb-4">
          {chatMessagesList.length === 0 && (
            <Card className="rounded-lg border border-border/40 bg-muted/20 shadow-none overflow-hidden block w-full select-none transform-gpu animate-in fade-in duration-200">
              <CardContent className="p-4 space-y-3 block w-full leading-none">
                <div className="flex items-start gap-2.5 leading-none w-full block">
                  <Sparkles className="h-4 w-4 text-primary stroke-[2.2] shrink-0 mt-0.5 select-none pointer-events-none animate-pulse" />
                  <div className="text-xs sm:text-sm font-medium text-foreground/80 leading-relaxed block flex-1">
                    Greetings Candidate! Pose queries relative to visas processing, program tracking timelines,
                    scholarships drawing, or IELTS parameter cutoffs inside{" "}
                    <strong className="text-foreground font-bold">
                      {destinationAgentMetadata.display_name.replace(" Destination Agent", "")}
                    </strong>{" "}
                    workspace blocks. Alternatively, leverage the{" "}
                    <strong className="text-primary font-bold">Syllabus Roadmap Engine</strong> button framework above
                    to compile an explicit 12-month alignment execution plan.
                  </div>
                </div>

                {availableProgramsCollection.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/5 text-[11px] font-semibold text-muted-foreground/60 leading-none block w-full space-y-1.5 shrink-0 select-text">
                    <div className="font-mono text-[9px] font-bold text-primary uppercase tracking-wide block leading-none pb-0.5 select-none pointer-events-none">
                      Verified Institutional Catalog Programs Available:
                    </div>
                    <ul className="space-y-1 block font-sans select-text tracking-normal">
                      {availableProgramsCollection.slice(0, 5).map((programItem) => (
                        <li key={`available-program-row-node-${programItem.id}`} className="truncate block">
                          <span>•</span>{" "}
                          <span className="text-foreground/70 font-bold">{programItem.university_name}</span>{" "}
                          <span>—</span> <span className="italic">{programItem.program_name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {chatMessagesList.map((messageNodeItem, indexPos) => {
            const isUserSenderFlag = messageNodeItem.role === "user";

            return (
              <div
                key={`chat-message-bubble-line-${indexPos}`}
                className={cn(
                  "flex w-full leading-none shrink-0 block antialiased",
                  isUserSenderFlag ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-3.5 py-2.5 max-w-[85%] text-xs sm:text-sm font-medium leading-relaxed block shadow-3xs text-left select-text tracking-normal whitespace-normal break-words",
                    isUserSenderFlag
                      ? "bg-primary text-primary-foreground font-semibold rounded-br-none"
                      : "bg-muted border border-border/20 text-foreground/90 rounded-bl-none",
                  )}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert text-inherit leading-relaxed font-sans block">
                    <ReactMarkdown>{messageNodeItem.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}

          {isAIEngineProcessing && (
            <div className="flex justify-start leading-none shrink-0 block antialiased w-full">
              <div className="rounded-lg rounded-bl-none px-3.5 py-2 bg-muted border border-border/20 shadow-3xs text-left block">
                <Loader2 className="h-4 w-4 animate-spin text-primary stroke-[2.5]" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* HUD LEVEL 3: ADMINISTRATIVE INTERACTION FIELD ENTRY CONTROL PANEL BAR */}
      <div className="p-3 border-t border-border/60 flex gap-2.5 sticky bottom-0 bg-background select-none leading-none w-full shrink-0 items-center z-10">
        <Input
          type="text"
          value={consoleTextInputStr}
          onChange={(e) => setConsoleTextInputStr(e.target.value)}
          onKeyDown={handleKeyboardInputInterceptor}
          placeholder="Input visa specifications, scholarship parameters, cutoff rows or university queries..."
          disabled={isAIEngineProcessing}
          className="w-full h-10 bg-background/50 border border-border/60 text-xs sm:text-sm font-semibold rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-ring flex-1 leading-normal px-3"
        />
        <Button
          type="button"
          onClick={handleDispatchConsoleQuerySequence}
          disabled={isAIEngineProcessing || !consoleTextInputStr.trim()}
          size="icon"
          className="h-10 w-10 rounded-lg bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 cursor-pointer transition-transform transform-gpu active:scale-95 shrink-0 block"
          title="Dispatch context parameter block query to target agent container"
        >
          <Send className="h-4 w-4 stroke-[2.5] mx-auto block" />
        </Button>
      </div>
    </div>
  );
}
