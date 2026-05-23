import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { aiInstructorChat } from "@/domains/learning/api/learningApi";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { Loader2, Send, CheckCircle, AlertCircle, Lightbulb, RefreshCw, Zap, Target, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { TIMEOUTS } from "@/lib/timeoutConfig";

export interface AIScenario {
  id: string;
  situation: string;
  context: string;
  question: string;
  difficulty: "easy" | "medium" | "hard";
  hints?: string[];
}

interface AIScenarioPlayerProps {
  scenario: AIScenario;
  professionLineId: string;
  onComplete?: (score: number) => void;
  className?: string;
}

interface FeedbackResponse {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

const DIFFICULTY_CONFIG = {
  easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

/**
 * GroUp Academy: AI Scenario Simulation Node (AIScenarioPlayer)
 * An authoritative operational sandbox layer parsing open-ended responses against automated cognitive model guidelines.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function AIScenarioPlayer({ scenario, professionLineId, onComplete, className }: AIScenarioPlayerProps) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef<boolean>(true);

  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize component state parameters defensively over activation lifecycles
  useEffect(() => {
    isMountedRef.current = true;
    trackEvent("ai_scenario_player_mounted", { scenarioId: scenario?.id, difficulty: scenario?.difficulty });
    return () => {
      isMountedRef.current = false;
    };
  }, [scenario?.id, scenario?.difficulty]);

  const hasHints = useMemo(() => !!(scenario?.hints && scenario.hints.length > 0), [scenario?.hints]);

  const handleExecutiveSubmit = async () => {
    const sanitizedInputText = answer.trim();
    if (!sanitizedInputText || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    trackEvent("ai_scenario_evaluation_requested", { scenarioId: scenario.id });

    const abortControllerInstance = new AbortController();
    const timeoutFallbackId = setTimeout(() => {
      abortControllerInstance.abort();
    }, TIMEOUTS?.AI_GENERATION || 30000);

    try {
      // INGRESS: Structured prompt matrix dispatch to cloud serverless execution node
      const remotePayloadResponse = await aiInstructorChat({
        messages: [
          {
            role: "user",
            content: `Evaluate this scenario response and provide structured feedback in JSON format.

SCENARIO:
Situation: ${scenario.situation}
Context: ${scenario.context}
Question: ${scenario.question}

USER'S ANSWER:
${sanitizedInputText}

Response Protocol: ONLY JSON object matching this schema. Do not prefix or append markdown wrapping code fences.
{
  "score": <number 1-10>,
  "feedback": "<overall feedback paragraph>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "modelAnswer": "<ideal answer example>"
}`,
          },
        ],
        professionLineId,
        contextType: "scenario_evaluation",
      } as any);

      clearTimeout(timeoutFallbackId);

      // Extract and safely map string objects into schema nodes
      const unparsedRawResponseText =
        typeof remotePayloadResponse === "string" ? remotePayloadResponse : JSON.stringify(remotePayloadResponse);

      const parsedStructuredJsonMatch = unparsedRawResponseText.match(/\{[\s\S]*\}/);

      if (!parsedStructuredJsonMatch) {
        throw new Error("Failed to load scenario: invalid data.");
      }

      const verifiedFeedbackDataObject = JSON.parse(parsedStructuredJsonMatch[0]) as FeedbackResponse;

      if (isMountedRef.current) {
        setFeedback(verifiedFeedbackDataObject);
        trackEvent("ai_scenario_evaluation_success", { score: verifiedFeedbackDataObject.score });

        // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
        await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
        await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
        await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

        if (onComplete) {
          onComplete(verifiedFeedbackDataObject.score);
        }
      }
    } catch (globalCatchErr: any) {
      clearTimeout(timeoutFallbackId);
      const isRequestAborted = globalCatchErr instanceof Error && globalCatchErr.name === "AbortError";
      const calculatedExceptionMessageString = isRequestAborted
        ? "Ecosystem connection timed out: Evaluation node latency limit exceeded. Please re-dispatch payload inputs."
        : globalCatchErr instanceof Error
          ? globalCatchErr.message
          : String(globalCatchErr);

      trackError(calculatedExceptionMessageString, {
        component: "AIScenarioPlayer",
        action: "commit_scenario_response_evaluation_api",
        scenarioId: scenario.id,
      });

      if (isMountedRef.current) {
        setError(calculatedExceptionMessageString);
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleResetProtocol = () => {
    trackEvent("ai_scenario_reset_triggered", { scenarioId: scenario.id });
    setFeedback(null);
    setAnswer("");
    setError(null);
    setShowHints(false);
  };

  return (
    <Card
      className={cn(
        "w-full text-left rounded-2xl border border-border/40 bg-card/30 backdrop-blur-md shadow-sm antialiased transform-gpu overflow-hidden",
        className,
      )}
    >
      {/* HUD LEVEL 1: TOP PANEL TRACK HEADING CONTAINER */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/10 bg-muted/10 select-none leading-none w-full">
        <div className="flex items-center justify-between gap-4 w-full leading-none">
          <div className="space-y-1 flex flex-col justify-center leading-none min-w-0 flex-1">
            <CardTitle className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2 leading-none block truncate">
              <Target className="h-4 w-4 text-primary stroke-[2.2] shrink-0 animate-pulse" />
              <span>Tactical Scenario Simulation</span>
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 block leading-none pt-0.5">
              Synthesize instructional parameters into direct operational executions
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "rounded px-2 h-5 text-[9px] font-extrabold tracking-wide uppercase leading-none select-none border border-transparent shrink-0 shadow-sm",
              DIFFICULTY_CONFIG[scenario.difficulty] || DIFFICULTY_CONFIG.medium,
            )}
          >
            {scenario.difficulty} tier
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4 w-full min-w-0 flex flex-col justify-center">
        {/* HUD LEVEL 2: IMMUTABLE SCENARIO TASK DISPLAY CARD */}
        <div className="grid grid-cols-1 gap-3.5 p-4 rounded-xl border border-border/40 bg-muted/10 shadow-inner relative overflow-hidden select-none w-full shrink-0">
          <Zap className="absolute -bottom-6 -right-6 h-24 w-24 text-primary opacity-[0.02] transform rotate-12 pointer-events-none" />

          <div className="space-y-3 relative z-10 text-left font-semibold text-xs tracking-tight">
            <div className="w-full min-w-0">
              <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider block leading-none mb-1.5">
                Contextual Framework Baseline
              </span>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-foreground/80 italic select-text">
                {scenario.situation}
              </p>
            </div>

            <div className="h-[1px] w-full bg-border/10" />

            <div className="w-full min-w-0">
              <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider block leading-none mb-1.5">
                Target Objective Assignment
              </span>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-foreground/90 select-text leading-snug">
                {scenario.question}
              </h3>
            </div>
          </div>
        </div>

        {/* HUD LEVEL 3: DYNAMIC OPTIONAL HINT PANEL SEGMENT LIST */}
        {hasHints && !feedback && (
          <div className="w-full text-left select-none shrink-0 leading-none">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                trackEvent("ai_scenario_hints_toggled", { nextState: !showHints });
                setShowHints(!showHints);
              }}
              className="h-7 rounded-xl font-bold uppercase text-[10px] tracking-wide gap-1.5 text-muted-foreground hover:bg-muted/20 hover:text-foreground cursor-pointer transition-colors leading-none"
            >
              <Lightbulb
                className={cn(
                  "h-3.5 w-3.5 transition-colors stroke-[2.2]",
                  showHints ? "fill-amber-500/10 text-amber-500" : "text-current",
                )}
              />
              <span>{showHints ? "Hide hints" : "Show hints"}</span>
            </Button>

            {showHints && (
              <div className="mt-2.5 grid grid-cols-1 gap-2 w-full animate-in slide-in-from-top-1 duration-200">
                {scenario.hints?.filter(Boolean).map((hintItem, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-primary/10 bg-primary/[0.01] text-[11px] sm:text-xs font-semibold leading-relaxed text-muted-foreground/80 italic text-left w-full min-w-0 shadow-sm animate-in slide-in-from-left-1 duration-150"
                  >
                    <span className="text-primary font-mono font-black text-xs select-none leading-none mt-0.5">
                      0{index + 1}
                    </span>
                    <p className="flex-1 pr-1 break-words select-text">{hintItem.trim()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HUD LEVEL 4: INTERACTIVE INPUT PANEL VS EVALUATED FEEDBACK OVERLAY DASHBOARD */}
        {!feedback ? (
          <div className="space-y-4 w-full min-w-0 flex flex-col justify-center text-left animate-in fade-in duration-200">
            <div className="space-y-1.5 w-full leading-none text-left select-none">
              <span className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-wider block pl-0.5 leading-none">
                Candidate Proposed Ingress Formulation
              </span>
              <Textarea
                placeholder="Type your response..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={5}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-border/40 bg-background/50 focus-visible:ring-1 focus-visible:ring-ring text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3.5 leading-relaxed italic resize-none shadow-inner"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl border border-rose-500/15 bg-rose-500/[0.02] text-rose-600 dark:text-rose-400 font-bold text-[10px] sm:text-xs uppercase tracking-wide text-left select-text break-words w-full animate-in shake duration-300">
                <AlertCircle className="h-4 w-4 stroke-[2.5] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="button"
              onClick={handleExecutiveSubmit}
              disabled={!answer.trim() || isSubmitting}
              className="w-full h-10 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.99] transition-all flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 mt-0.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                  <span>Processing Cognitive Evaluation Manifest…</span>
                </>
              ) : (
                <>
                  <span>Dispatch Formulation Submission</span>
                  <Send className="h-3.5 w-3.5 stroke-[2.2] ml-0.5" />
                </>
              )}
            </Button>
          </div>
        ) : (
          /* SECTION B: MULTI-LEVEL COGNITIVE FEEDBACK SCORE GRAPH DISPLAY DECK */
          <div className="space-y-5 w-full min-w-0 flex flex-col justify-center text-left animate-in zoom-in-99 duration-300">
            {/* SCORE CHIP PANEL HUD CONTAINER */}
            <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-muted/20 border border-border/10 shadow-sm relative overflow-hidden select-none text-center w-full shrink-0">
              <div
                className={cn(
                  "absolute inset-0 blur-3xl opacity-[0.03] transition-colors duration-500 pointer-events-none",
                  feedback.score >= 7 ? "bg-emerald-500" : feedback.score >= 5 ? "bg-amber-500" : "bg-rose-500",
                )}
              />
              <span className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-wider block leading-none mb-3">
                Algorithmic Performance Alignment Scale
              </span>
              <div className="flex items-baseline justify-center gap-0.5 leading-none italic block select-all font-bold text-foreground">
                <span className="text-5xl sm:text-6xl font-black tracking-tighter selection:bg-primary/20 leading-none">
                  {feedback.score}
                </span>
                <span className="text-sm font-extrabold text-muted-foreground/30 font-mono tracking-normal">/10</span>
              </div>
            </div>

            {/* OVERALL SCORE COMMENTARY RATIONALE TEXT LAYER */}
            <div className="space-y-1 w-full min-w-0 leading-none text-left">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary block pl-0.5 leading-none select-none">
                Systemic Executive Rationale
              </span>
              <p className="text-xs sm:text-sm font-semibold leading-relaxed text-foreground/80 bg-muted/10 border border-border/10 p-4 rounded-xl italic select-text selection:bg-primary/10 w-full pr-1">
                {feedback.feedback ? feedback.feedback.trim() : "No performance commentary compiled."}
              </p>
            </div>

            {/* STRONGS VS FIXES TWO-COLUMN MATRIX SPLIT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full min-w-0 font-bold text-xs tracking-tight text-left">
              <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.015] space-y-3 min-w-0 w-full">
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 italic flex items-center gap-1.5 select-none leading-none">
                  <ShieldCheck className="h-3.5 w-3.5 stroke-[2.5]" /> Identified Core Strengths
                </span>
                <ul className="space-y-2.5 font-semibold text-xs leading-normal">
                  {feedback.strengths && feedback.strengths.filter(Boolean).length > 0 ? (
                    feedback.strengths.map((strengthStr, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 italic select-text break-words pr-1 text-foreground/90"
                      >
                        <div className="h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/5 flex items-center justify-center shrink-0 mt-0.5 select-none">
                          <CheckCircle className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                        </div>
                        <span className="flex-1 min-w-0 pt-0.5">{strengthStr.trim()}</span>
                      </li>
                    ))
                  ) : (
                    <li className="list-none italic text-muted-foreground/50 select-none pl-0.5 text-[11px]">
                      No unique asset milestones mapped.
                    </li>
                  )}
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.015] space-y-3 min-w-0 w-full">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 italic flex items-center gap-1.5 select-none leading-none">
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 stroke-[2.2]" /> Parameter Optimizations
                </span>
                <ul className="space-y-2.5 font-semibold text-xs leading-normal">
                  {feedback.improvements && feedback.improvements.filter(Boolean).length > 0 ? (
                    feedback.improvements.map((improvementStr, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 italic select-text break-words pr-1 text-foreground/90"
                      >
                        <div className="h-4 w-4 rounded-full bg-amber-500/10 border border-amber-500/5 flex items-center justify-center shrink-0 mt-0.5 select-none">
                          <Zap className="h-2.5 w-2.5 text-amber-600 dark:text-amber-500 fill-amber-600/10 stroke-[2.5]" />
                        </div>
                        <span className="flex-1 min-w-0 pt-0.5">{improvementStr.trim()}</span>
                      </li>
                    ))
                  ) : (
                    <li className="list-none italic text-muted-foreground/50 select-none pl-0.5 text-[11px]">
                      No structural calibration vulnerabilities detected.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* AUTHORITATIVE STRUCTURAL EXEMPLAR COMPONENT */}
            <div className="p-4 rounded-xl border border-primary/10 bg-primary/[0.01] relative w-full min-w-0 text-left leading-normal font-semibold text-xs">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-primary block pl-0.5 leading-none select-none mb-2">
                Authoritative Reference Model Artifact
              </span>
              <p className="font-medium italic leading-relaxed text-muted-foreground select-text selection:bg-primary/10 break-words pr-1">
                {feedback.modelAnswer ? feedback.modelAnswer.trim() : "Exemplar curriculum reference text unavailable."}
              </p>
            </div>

            {/* RE-INITIALIZATION ACTION CONTROLLER RIBBON */}
            <Button
              type="button"
              onClick={handleResetProtocol}
              variant="outline"
              className="w-full h-10 rounded-xl border border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 shadow-sm cursor-pointer hover:bg-accent gap-1.5 flex items-center justify-center transition-transform active:scale-[0.99]"
            >
              <RefreshCw className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Re-Initialize Tactical Scenario Simulation</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
