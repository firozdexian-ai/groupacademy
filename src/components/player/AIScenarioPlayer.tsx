import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, CheckCircle, AlertCircle, Lightbulb, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

export function AIScenarioPlayer({ 
  scenario, 
  professionLineId,
  onComplete,
  className 
}: AIScenarioPlayerProps) {
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const difficultyColors = {
    easy: "bg-green-500/10 text-green-600",
    medium: "bg-yellow-500/10 text-yellow-600",
    hard: "bg-red-500/10 text-red-600",
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    setError(null);

    // Create a timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.AI_GENERATION);

    try {
      const responsePromise = supabase.functions.invoke('ai-instructor-chat', {
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

Please evaluate and respond with ONLY a JSON object (no markdown, no extra text):
{
  "score": <number 1-10>,
  "feedback": "<overall feedback paragraph>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "modelAnswer": "<ideal answer example>"
}`
            }
          ],
          professionLineId,
          contextType: "scenario_evaluation"
        }
      });

      const response = await Promise.race([
        responsePromise,
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('AI analysis timed out. Please try again.'));
          });
        })
      ]);

      clearTimeout(timeoutId);

      if (response.error) throw new Error(response.error.message);

      // Parse streaming response
      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                fullResponse += data.choices[0].delta.content;
              }
            } catch {}
          }
        }
      }

      // Parse the JSON response
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const feedbackData = JSON.parse(jsonMatch[0]) as FeedbackResponse;
        setFeedback(feedbackData);
        onComplete?.(feedbackData.score);
      } else {
        throw new Error("Could not parse AI response");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get feedback";
      setError(errorMessage.includes("abort") ? "AI analysis timed out. Please try again." : errorMessage);
    } finally {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setFeedback(null);
    setAnswer("");
    setError(null);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Practice Scenario</CardTitle>
          <Badge className={difficultyColors[scenario.difficulty]}>
            {scenario.difficulty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Scenario */}
        <div className="space-y-3 bg-muted p-4 rounded-lg">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">SITUATION</p>
            <p className="text-sm">{scenario.situation}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">CONTEXT</p>
            <p className="text-sm">{scenario.context}</p>
          </div>
          
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">YOUR TASK</p>
            <p className="text-sm font-medium">{scenario.question}</p>
          </div>
        </div>

        {/* Hints */}
        {scenario.hints && scenario.hints.length > 0 && !feedback && (
          <div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowHints(!showHints)}
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              {showHints ? "Hide Hints" : "Show Hints"}
            </Button>
            
            {showHints && (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {scenario.hints.map((hint, i) => (
                  <li key={i}>💡 {hint}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Answer Input or Feedback */}
        {!feedback ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Write your response here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              disabled={isSubmitting}
            />
            
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            )}
            
            <Button 
              onClick={handleSubmit}
              disabled={!answer.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Answer
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Score */}
            <div className="flex items-center justify-center">
              <div className={cn(
                "text-center p-4 rounded-full",
                feedback.score >= 7 ? "bg-green-500/10" : 
                feedback.score >= 5 ? "bg-yellow-500/10" : "bg-red-500/10"
              )}>
                <p className="text-3xl font-bold">
                  {feedback.score}/10
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Feedback</p>
                <p className="text-sm text-muted-foreground">{feedback.feedback}</p>
              </div>

              {feedback.strengths.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 text-green-600">Strengths</p>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1 text-orange-600">Areas to Improve</p>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Model Answer</p>
                <p className="text-sm text-muted-foreground">{feedback.modelAnswer}</p>
              </div>
            </div>

            <Button onClick={handleRetry} variant="outline" className="w-full">
              Try Another Response
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
