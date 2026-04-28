import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle, AlertCircle, Lightbulb, RefreshCw, Zap, Target, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { TIMEOUTS } from "@/lib/timeoutConfig";

/**
 * GroUp Academy: AI Scenario Simulation Node
 * CTO Reference: Authoritative node for real-time situational evaluation.
 */

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

export function AIScenarioPlayer({ scenario, professionLineId, onComplete, className }: AIScenarioPlayerProps) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const difficultyConfig = {
    easy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    hard: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  };

  const handleExecutiveSubmit = async () => {
    if (!answer.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.AI_GENERATION);

    try {
      // INGRESS: Neural Analysis Request
      const response = await supabase.functions.invoke("ai-instructor-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `Evaluate this scenario response and provide structured feedback in JSON format.

SCENARIO:
Situation: ${scenario.situation}
Context: ${scenario.context}
Question: ${scenario.question}

USER'S ANSWER:
${answer}

Response Protocol: ONLY JSON object.
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
        },
      });

      if (response.error) throw new Error(response.error.message);

      // CTO Note: Normalizing response artifact
      const feedbackText = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const feedbackData = JSON.parse(jsonMatch[0]) as FeedbackResponse;
        setFeedback(feedbackData);
        onComplete?.(feedbackData.score);
      } else {
        throw new Error("Neural Ingestion Fault: Malformed response.");
      }
    } catch (err: any) {
      setError(err.message.includes("abort") ? "Sync_Timeout: Registry offline." : err.message);
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  const handleResetProtocol = () => {
    setFeedback(null);
    setAnswer("");
    setError(null);
  };

  return (
    <Card
      className={cn(
        "rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-500",
        className,
      )}
    >
      <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" /> Tactical_Simulation
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
              Apply knowledge artifacts to professional context
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "rounded-lg px-3 py-1 font-black italic text-[9px] uppercase tracking-widest border-2",
              difficultyConfig[scenario.difficulty],
            )}
          >
            {scenario.difficulty}_LEVEL
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-8 space-y-8 text-left">
        {/* ARTIFACT: SCENARIO_DATA */}
        <div className="grid gap-6 p-6 rounded-[24px] bg-muted/20 border-2 border-border/10 shadow-inner relative overflow-hidden">
          <Zap className="absolute -bottom-6 -right-6 h-32 w-32 text-primary opacity-5 rotate-12" />

          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">
                Global_Situation
              </p>
              <p className="text-sm font-bold leading-relaxed text-foreground/90 italic">{scenario.situation}</p>
            </div>

            <div className="h-px bg-border/40" />

            <div>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Target_Task</p>
              <p className="text-base font-black italic tracking-tight">{scenario.question}</p>
            </div>
          </div>
        </div>

        {/* COMPONENT: HINT_INGRESS */}
        {scenario.hints && scenario.hints.length > 0 && !feedback && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHints(!showHints)}
              className="h-8 rounded-xl font-black italic text-[10px] tracking-widest gap-2 hover:bg-primary/5"
            >
              <Lightbulb className={cn("h-4 w-4", showHints ? "fill-primary text-primary" : "text-muted-foreground")} />
              {showHints ? "HIDE_HINT_NODES" : "REVEAL_HINT_NODES"}
            </Button>

            {showHints && (
              <div className="mt-4 grid gap-2">
                {scenario.hints.map((hint, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] font-medium italic animate-in slide-in-from-left-2"
                  >
                    <span className="text-primary text-xs font-black">0{i + 1}</span>
                    {hint}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INPUT_NODE or FEEDBACK_DASHBOARD */}
        {!feedback ? (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] ml-1">
                Proposed_Response_Field
              </p>
              <Textarea
                placeholder="Initialize response sequence..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={6}
                disabled={isSubmitting}
                className="rounded-2xl border-2 font-medium italic bg-background/50 focus-visible:ring-primary/20 resize-none p-5"
              />
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border-2 border-rose-500/20 text-rose-500 text-[10px] font-black uppercase">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={handleExecutiveSubmit}
              disabled={!answer.trim() || isSubmitting}
              className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest shadow-[0_10px_30px_rgba(var(--primary),0.3)] active:scale-95 transition-all gap-3"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {isSubmitting ? "ANALYZING_NODE_RESPONSE..." : "EXECUTE_SUBMISSION"}
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in zoom-in-95 duration-1000">
            {/* HUD: SCORE_TELEMETRY */}
            <div className="flex flex-col items-center justify-center p-8 rounded-[40px] bg-gradient-to-br from-muted/5 to-muted/20 border-2 border-border/10 shadow-2xl relative overflow-hidden">
              <div
                className={cn(
                  "absolute inset-0 blur-3xl opacity-10",
                  feedback.score >= 7 ? "bg-emerald-500" : feedback.score >= 5 ? "bg-amber-500" : "bg-rose-500",
                )}
              />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em] mb-4 italic">
                Performance_Yield
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-7xl font-black tracking-tighter italic">{feedback.score}</span>
                <span className="text-xl font-black text-muted-foreground/30">/10</span>
              </div>
            </div>

            {/* FEEDBACK_MATRICES */}
            <div className="grid gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                  Executive_Feedback
                </p>
                <p className="text-sm font-medium italic leading-relaxed text-foreground/80 bg-muted/5 p-5 rounded-2xl border-2 border-border/10">
                  {feedback.feedback}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-500/5 border-2 border-emerald-500/10 space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 italic flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> Artifact_Strengths
                  </p>
                  <ul className="space-y-3">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-[11px] font-bold flex items-start gap-3 italic">
                        <div className="h-4 w-4 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                        </div>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-amber-500/5 border-2 border-amber-500/10 space-y-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 italic flex items-center gap-2">
                    <Zap className="h-3 w-3" /> Growth_Optimizations
                  </p>
                  <ul className="space-y-3">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-[11px] font-bold flex items-start gap-3 italic">
                        <div className="h-4 w-4 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Zap className="h-3 w-3 text-amber-600 fill-current" />
                        </div>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 rounded-[24px] bg-primary/5 border-2 border-primary/10 relative group">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 italic">
                  Authoritative_Model_Artifact
                </p>
                <p className="text-xs font-medium italic leading-relaxed text-muted-foreground">
                  {feedback.modelAnswer}
                </p>
              </div>
            </div>

            <Button
              onClick={handleResetProtocol}
              variant="outline"
              className="w-full h-14 rounded-2xl border-2 font-black uppercase italic text-xs tracking-widest gap-3 shadow-lg active:scale-95 transition-all"
            >
              <RefreshCw className="h-4 w-4" /> RE_INITIALIZE_SIMULATION
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
