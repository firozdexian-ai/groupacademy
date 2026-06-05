import { useEffect, useRef, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Loader2, MessageSquare, Send, Award, Zap, HelpCircle } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { learnerScenarioEvaluate, learnerScenarioPool } from "@/domains/learning/api/learningApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Scenario {
  id: string;
  title: string;
  scenario_prompt: string;
  rubric: any[];
}
type Msg = { role: "user" | "assistant"; content: string };

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learner-scenario-pool`;

/**
 * GroUp Academy: Interactive Simulation Scenario Runner (ModuleScenarioRunner)
 * Conversational streaming engine and psychometric evaluation card suite.
 */
export function ModuleScenarioRunner({ moduleId, onComplete }: { moduleId: string; onComplete?: () => void }) {
  const queryClient = useQueryClient();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conv, setConv] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Monitor dynamic interactive scenario views via analytics
  useEffect(() => {
    if (moduleId) {
      trackEvent("simulation_scenario_runner_mounted", { moduleId });
    }
  }, [moduleId]);

  // Safe Asynchronous Lifecycle Guard: Prevent states from updating on unmounted nodes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const allocateActiveScenarioNode = async () => {
      try {
        const data = await learnerScenarioPool({ mode: "draw", module_id: moduleId });

        if (data?.error) {
          throw new Error(data.error);
        }

        if (isMounted) {
          setScenario((data as any).scenario);
          setLoading(false);
          trackEvent("simulation_scenario_draw_success", { moduleId, scenarioId: (data as any).scenario?.id });
        }
      } catch (err: any) {
        const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

        trackError(parsedExceptionMsg, {
          component: "ModuleScenarioRunner",
          action: "allocate_active_scenario_node_api",
          moduleId,
        });

        toast.error(`Unable to initialize simulation context: ${parsedExceptionMsg}`);
        if (isMounted) setLoading(false);
      }
    };

    allocateActiveScenarioNode();

    return () => {
      isMounted = false;
    };
  }, [moduleId]);

  // Handle automatic scrolling anchoring down conversational threads safely
  useEffect(() => {
    const scrollContainerElement = scrollRef.current;
    if (scrollContainerElement) {
      scrollContainerElement.scrollTo({
        top: scrollContainerElement.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [conv]);

  const send = async () => {
    const cleanInputPayload = input.trim();
    if (!cleanInputPayload || !scenario || streaming) return;

    const userMsg: Msg = { role: "user", content: cleanInputPayload };
    const newConv = [...conv, userMsg];

    setConv(newConv);
    setInput("");
    setStreaming(true);

    trackEvent("simulation_scenario_turn_dispatched", { moduleId, scenarioId: scenario.id });

    try {
      const session = await getCurrentSession();
      if (!session) throw new Error("AUTH_SYNC_REQUIRED");

      const responseTokenStream = await fetch(STREAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mode: "turn",
          module_id: moduleId,
          scenario_prompt: scenario.scenario_prompt,
          conversation: conv,
          user_message: cleanInputPayload,
        }),
      });

      if (!responseTokenStream.ok || !responseTokenStream.body) {
        throw new Error(`Edge stream connection rejected with status code: [${responseTokenStream.status}]`);
      }

      const streamBufferReader = responseTokenStream.body.getReader();
      const textualDecoderInstance = new TextDecoder();

      let compositeChunkBuffer = "";
      let compiledAssistantContentStr = "";

      setConv((c) => [...c, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await streamBufferReader.read();
        if (done) break;

        compositeChunkBuffer += textualDecoderInstance.decode(value, { stream: true });
        let newlineIndexPosition: number;

        while ((newlineIndexPosition = compositeChunkBuffer.indexOf("\n")) !== -1) {
          let atomicLineToken = compositeChunkBuffer.slice(0, newlineIndexPosition);
          compositeChunkBuffer = compositeChunkBuffer.slice(newlineIndexPosition + 1);

          if (atomicLineToken.endsWith("\r")) {
            atomicLineToken = atomicLineToken.slice(0, -1);
          }
          if (!atomicLineToken.startsWith("data: ")) continue;

          const jsonPayloadStringToken = atomicLineToken.slice(6).trim();
          if (jsonPayloadStringToken === "[DONE]") {
            compositeChunkBuffer = "";
            break;
          }

          try {
            const parsedTokenDelta = JSON.parse(jsonPayloadStringToken);
            const dynamicCharacterChunk = parsedTokenDelta.choices?.[0]?.delta?.content;

            if (dynamicCharacterChunk) {
              compiledAssistantContentStr += dynamicCharacterChunk;
              setConv((cur) => {
                const updatedArrayCopy = [...cur];
                updatedArrayCopy[updatedArrayCopy.length - 1] = {
                  role: "assistant",
                  content: compiledAssistantContentStr,
                };
                return updatedArrayCopy;
              });
            }
          } catch {
            // Re-stitch raw fragments if segment boundaries break text data lines
            compositeChunkBuffer = atomicLineToken + "\n" + compositeChunkBuffer;
            break;
          }
        }
      }
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedExceptionMsg, {
        component: "ModuleScenarioRunner",
        action: "stream_conversational_turn_protocol",
        moduleId,
        scenarioId: scenario.id,
      });

      toast.error(`Classroom connection dropped: ${parsedExceptionMsg}`);
    } finally {
      setStreaming(false);
    }
  };

  const finishAndEvaluate = async () => {
    if (!scenario) return;

    setEvaluating(true);
    const toastId = toast.loading("Analyzing your exercise and compiling feedback report...");

    trackEvent("simulation_scenario_evaluation_requested", { scenarioId: scenario.id });

    try {
      // Persist conversation run state cleanly to obtain unique run ID token
      const created = await learnerScenarioPool({
        mode: "create_run",
        module_id: moduleId,
        scenario_id: scenario.id,
        conversation: conv,
      });

      if (created?.error || !created?.run_id) {
        throw new Error(created?.error || "Failed to finalize historic text log mapping.");
      }

      const activeRunIdToken = created.run_id;

      // Evaluate performance parameters via serverless grading models
      const evalData = await learnerScenarioEvaluate({ run_id: activeRunIdToken });

      if (evalData?.error) {
        throw new Error(evalData.error);
      }

      setEvalResult((evalData as any).evaluation);

      // Synchronize index cache parameters across workspace tabs cleanly
      queryClient.invalidateQueries({ queryKey: ["module-analytics", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["item-analytics", moduleId] });
      queryClient.invalidateQueries({ queryKey: ["talent-stats"] });

      toast.success("Evaluation analysis compiled.", { id: toastId });
      trackEvent("simulation_scenario_evaluation_success", { scenarioId: scenario.id, runId: activeRunIdToken });

      if (onComplete) onComplete();
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedExceptionMsg, {
        component: "ModuleScenarioRunner",
        action: "finish_and_evaluate_simulation",
        scenarioId: scenario.id,
      });

      toast.error(`Evaluation processing error: ${parsedExceptionMsg}`, { id: toastId });
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl select-none w-full animate-in scale-in duration-200">
        <CardContent className="py-12 flex flex-col items-center justify-center gap-3.5 text-center w-full">
          <Loader2 className="h-5 w-5 animate-spin text-primary stroke-[2.5]" />
          <p className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider pl-0.5 animate-pulse">
            Loading exercise parameters...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!scenario) return null;

  // View Screen A: Simulation Evaluation Grading Report Dashboard View
  if (evalResult) {
    const isV1 = evalResult.version === 1 || Array.isArray(evalResult.topics);
    const overallPct = Math.round(isV1 ? Number(evalResult.overall ?? 0) * 100 : Number(evalResult.overall_score ?? 0));

    const normalizedReportItems: Array<{ label: string; pct: number; notes?: string }> = isV1
      ? (evalResult.topics ?? []).map((t: any) => ({
          label: String(t.tag ?? "Skill").replace(/_/g, " "),
          pct: Math.round(Number(t.score ?? 0) * 100),
          notes: t.notes,
        }))
      : (evalResult.criteria ?? []).map((c: any) => ({
          label: String(c.criterion ?? "Evaluation Criterion"),
          pct: Math.round(Number(c.score ?? 0)),
          notes: c.feedback,
        }));

    return (
      <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden w-full animate-in zoom-in-98 duration-300 text-left">
        <CardHeader className="p-4 px-5 border-b border-border/10 select-none bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <CardTitle className="text-sm font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2.5">
              <Award className="h-5 w-5 text-primary stroke-[2.2]" />
              <span>Simulation Performance Review</span>
            </CardTitle>
            <Badge
              variant="outline"
              className="w-fit bg-primary/5 text-primary border-primary/20 text-xs font-extrabold px-2 py-0.5 rounded shadow-sm tabular-nums"
            >
              Overall Score: {overallPct}%
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 text-left">
          {evalResult.summary && (
            <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 font-medium text-xs sm:text-sm leading-relaxed text-foreground/80 italic break-words select-text">
              &ldquo;{evalResult.summary.trim()}&rdquo;
            </div>
          )}

          {isV1 && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/10 text-[10px] sm:text-xs font-bold text-muted-foreground/80 leading-none select-none pl-3.5">
              <Zap className="h-4 w-4 text-warning fill-warning/5 stroke-[2.2]" />
              <p>Subject focus weights successfully saved. Your adaptive topic queues have been updated dynamically.</p>
            </div>
          )}

          <div className="space-y-3 w-full pt-1">
            {normalizedReportItems.map((reportItem, i) => (
              <div
                key={i}
                className="border border-border/40 bg-background/40 backdrop-blur-sm rounded-xl p-3.5 space-y-2.5 text-left w-full min-w-0 shadow-sm animate-in fade-in duration-200"
              >
                <div className="flex justify-between items-center text-xs sm:text-sm font-bold tracking-tight text-foreground/90 uppercase select-none leading-none tabular-nums">
                  <span className="truncate pr-4 max-w-[80%]">{reportItem.label}</span>
                  <span className="bg-muted px-2 py-0.5 rounded border border-border/40 font-mono text-xs">
                    {reportItem.pct}%
                  </span>
                </div>

                <Progress value={reportItem.pct} className="h-1.5 rounded-full bg-muted/40 shadow-inner select-none" />

                {reportItem.notes && (
                  <p className="text-xs font-semibold leading-relaxed text-muted-foreground/90 break-words select-text pt-0.5">
                    {reportItem.notes.trim()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // View Screen B: Active Chat Simulation Interface
  return (
    <Card className="border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden w-full text-left">
      <CardHeader className="p-4 px-5 border-b border-border/10 select-none bg-muted/20">
        <CardTitle className="text-sm font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-primary stroke-[2.2]" />
          <span className="truncate pr-1">{scenario.title || "Interactive Scenario"}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0">
        {/* Scenario Prompt Context Block */}
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-3.5 text-xs sm:text-sm font-semibold text-foreground/80 leading-relaxed select-text break-words shadow-sm">
          {scenario.scenario_prompt}
        </div>

        {/* Messaging Logs Interaction Window Box */}
        <div
          ref={scrollRef}
          className="border border-border/40 bg-background/20 rounded-xl p-3.5 max-h-80 overflow-y-auto space-y-3 shadow-inner w-full min-w-0 font-medium"
        >
          {conv.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center select-none gap-2 text-muted-foreground/40 animate-pulse">
              <HelpCircle className="h-6 w-6 stroke-[2.2]" />
              <p className="text-xs font-bold uppercase tracking-wider italic leading-none pl-0.5">
                Awaiting your reply...
              </p>
            </div>
          )}

          {conv.map((messageItem, index) => {
            const isUserRole = messageItem.role === "user";
            const currentItemLoadingIndex = streaming && index === conv.length - 1;

            return (
              <div
                key={index}
                className={cn(
                  "text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 max-w-[85%] border shadow-sm select-text break-words text-left flex flex-col leading-relaxed animate-in slide-in-from-bottom-1 duration-150 w-fit",
                  isUserRole
                    ? "bg-primary/10 border-primary/20 text-foreground ml-auto rounded-tr-none"
                    : "bg-muted/60 border-border/40 text-foreground mr-auto rounded-tl-none",
                )}
              >
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 select-none mb-1 leading-none">
                  {isUserRole ? "You" : "Scenario role"}
                </span>

                <p className="select-text whitespace-pre-wrap">{messageItem.content}</p>

                {currentItemLoadingIndex && !messageItem.content && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0 mt-1 stroke-[2.5]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Input Text Triggers Form Row */}
        <div className="flex gap-2 w-full select-none pt-0.5">
          <Input
            value={input}
            disabled={streaming}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type your response and press Enter to send..."
            className="rounded-xl border border-border/40 bg-card/40 focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm font-medium w-full h-10 shadow-sm"
          />
          <Button
            onClick={send}
            disabled={streaming || !input.trim()}
            size="icon"
            type="button"
            className="h-10 w-10 rounded-xl shrink-0 cursor-pointer shadow-md active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Send message"
          >
            <Send className="h-4 w-4 text-primary-foreground stroke-[2.2]" />
          </Button>
        </div>

        {/* Submit Performance Review Completion Trigger Button */}
        {conv.length >= 4 && (
          <Button
            onClick={finishAndEvaluate}
            disabled={evaluating || streaming}
            type="button"
            variant="outline"
            className="w-full h-10 rounded-xl font-bold text-xs tracking-wide uppercase border border-border/40 hover:border-primary/20 bg-background/40 hover:bg-primary/5 cursor-pointer transition-all active:scale-[0.99] gap-2 select-none mt-2"
          >
            {evaluating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary stroke-[2.5]" />
                <span>Compiling metrics evaluation...</span>
              </>
            ) : (
              <>
                <Award className="h-4 w-4 text-primary stroke-[2.5]" />
                <span>Submit for Review</span>
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
