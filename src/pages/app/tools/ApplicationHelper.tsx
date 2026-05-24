import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList, Loader2, Sparkles, Coins, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { recordToolRun } from "@/hooks/useToolRuns";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { toast } from "sonner";
import { generateApplicationAnswers } from "@/domains/jobs/api/jobsApi";

/**
 * Application Answer Sheet — paste application questions, get tailored answers
 * grounded in the user's profile.
 */
export default function ApplicationHelper() {
 const navigate = useNavigate();
 const { talent } = useTalent();
 const { canAfford, deductCredits } = useCredits();
 const [questions, setQuestions] = useState("");
 const [jobContext, setJobContext] = useState("");
 const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
 const [running, setRunning] = useState(false);

 const cost = CREDIT_CONFIG.SERVICES.APPLICATION_ANSWERS.cost;

 async function handleRun() {
 if (!talent) return toast.error("Profile not loaded.");
 const trimmed = questions.trim();
 if (trimmed.length < 10) return toast.error("Paste at least one question.");
 if (!canAfford("APPLICATION_ANSWERS")) return toast.error(`Need ${cost} credits.`);

 setRunning(true);
 try {
 const data = await generateApplicationAnswers({ questions: trimmed, jobContext: jobContext.trim() || null });
 const result = (data?.answers || []) as { question: string; answer: string }[];
 if (!result.length) throw new Error("No answers returned");
 await deductCredits("APPLICATION_ANSWERS", undefined, "Application answer sheet");
 setAnswers(result);
 recordToolRun({ toolKey: "answers", costCredits: cost, payload: { count: result.length } });
 toast.success("Answers ready.");
 } catch (e) {
 console.error(e);
 toast.error("Couldn't generate answers. Try again.");
 } finally {
 setRunning(false);
 }
 }

 function copyAll() {
 const text = answers.map((a) => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");
 navigator.clipboard.writeText(text).then(() => toast.success("Copied"));
 }

 return (
 <div className="max-w-2xl mx-auto px-3 py-3 pb-28 space-y-4">
 <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2">
 <ArrowLeft className="h-4 w-4" /> Back
 </Button>

 <header className="space-y-1">
 <div className="flex items-center gap-2">
 <ClipboardList className="h-5 w-5 text-primary" />
 <h1 className="text-xl font-bold">Application answers</h1>
 </div>
 <p className="text-xs text-muted-foreground">
 Paste application questions — we'll draft answers grounded in your profile.
 </p>
 </header>

 <Card className="rounded-2xl border border-border/40">
 <CardContent className="p-4 space-y-3">
 <div className="space-y-1.5">
 <label className="text-xs font-medium">Questions (one per line)</label>
 <Textarea
 value={questions}
 onChange={(e) => setQuestions(e.target.value)}
 placeholder={"Why do you want this role?\nDescribe a challenge you overcame.\nWhat are your salary expectations?"}
 rows={6}
 className="text-sm rounded-lg"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-xs font-medium">Job context <span className="text-muted-foreground">(optional)</span></label>
 <Textarea
 value={jobContext}
 onChange={(e) => setJobContext(e.target.value)}
 placeholder="Paste the job title, company, or a snippet of the JD..."
 rows={3}
 className="text-sm rounded-lg"
 />
 </div>

 <div className="flex items-center justify-between pt-1">
 <Badge variant="outline" className="gap-1 text-[10px]">
 <Coins className="h-3 w-3 text-amber-500" /> {cost} credits
 </Badge>
 <Button onClick={handleRun} disabled={running} size="sm" className="h-9 rounded-lg">
 {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
 {running ? "Drafting..." : "Generate answers"}
 </Button>
 </div>
 </CardContent>
 </Card>

 {answers.length > 0 && (
 <Card className="rounded-2xl border border-border/40">
 <CardContent className="p-4 space-y-3">
 <div className="flex items-center justify-between">
 <h2 className="text-sm font-semibold">Your answers</h2>
 <Button variant="outline" size="sm" onClick={copyAll} className="h-8 rounded-lg gap-1.5 text-xs">
 <Copy className="h-3.5 w-3.5" /> Copy all
 </Button>
 </div>
 <div className="space-y-3">
 {answers.map((a, i) => (
 <div key={i} className="space-y-1 border-t border-border/40 pt-3 first:border-0 first:pt-0">
 <p className="text-xs font-semibold text-primary">Q{i + 1}. {a.question}</p>
 <p className="text-sm whitespace-pre-wrap leading-relaxed">{a.answer}</p>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 );
}
