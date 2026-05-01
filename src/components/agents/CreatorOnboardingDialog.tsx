import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Bot, Send, Loader2, ShieldCheck, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";

/**
 * 3-step creator onboarding to publish an agent to the marketplace.
 * Step 1: Brief — name + description + use case.
 * Step 2: Brain — AI blueprint suggestion (preview).
 * Step 3: Pricing & submit for review.
 */
export function CreatorOnboardingDialog({
  open, onOpenChange, onCreated,
}: { open: boolean; onOpenChange: (v: boolean) => void; onCreated?: () => void }) {
  const { talent } = useTalent();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [blueprint, setBlueprint] = useState<{ system_prompt?: string; allowed_tools?: string[]; description?: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [credits, setCredits] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const STEPS = ["Brief", "Brain", "Publish"];
  const progress = ((step + 1) / STEPS.length) * 100;

  function reset() {
    setStep(0); setName(""); setBrief(""); setBlueprint(null); setCredits(2);
  }

  async function generateBlueprint() {
    if (!brief.trim() || brief.length < 20) {
      return toast.error("Add a longer brief (20+ chars) for better results.");
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-blueprint", {
        body: { brief, name: name || "New agent" },
      });
      if (error) throw error;
      setBlueprint(data?.blueprint ?? data ?? null);
      setStep(1);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate blueprint. You can still continue manually.");
      setBlueprint({ system_prompt: brief, allowed_tools: [], description: brief.slice(0, 140) });
      setStep(1);
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    if (!talent?.id) return toast.error("Sign in required");
    if (!name.trim()) return toast.error("Agent needs a name");
    setSubmitting(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6);
    const { error } = await supabase.from("ai_agents").insert({
      agent_key: slug,
      name,
      description: blueprint?.description ?? brief.slice(0, 200),
      system_prompt: blueprint?.system_prompt ?? brief,
      allowed_tools: blueprint?.allowed_tools ?? [],
      owner_kind: "talent",
      owner_id: talent.id,
      visibility: "private",
      marketplace_status: "pending",
      message_credit_cost: credits,
      is_active: true,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Agent submitted for review", { description: "Our team will approve it shortly." });
    onCreated?.();
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Become an Agent Builder
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mb-2">
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            {STEPS.map((s, i) => (
              <span key={s} className={i === step ? "text-primary font-bold" : ""}>{i + 1}. {s}</span>
            ))}
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <div>
              <Label>Agent name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Resume Polisher" maxLength={50} />
            </div>
            <div>
              <Label>What does it do?</Label>
              <Textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Describe your agent's purpose, audience, and what makes it special. The more detail, the better the AI blueprint."
                rows={6}
              />
              <p className="text-[11px] text-muted-foreground mt-1">{brief.length} / 1000</p>
            </div>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 text-xs flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>You earn <strong>50% of the credits</strong> spent on every conversation with your agent. Payouts available once approved.</span>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">AI suggested the following configuration. You can refine it later in Agent Studio.</p>
            <Card>
              <CardContent className="p-3 space-y-2 text-xs">
                <div>
                  <div className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">System prompt</div>
                  <p className="whitespace-pre-wrap line-clamp-6">{blueprint?.system_prompt ?? brief}</p>
                </div>
                {blueprint?.allowed_tools && blueprint.allowed_tools.length > 0 && (
                  <div>
                    <div className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground mb-1">Tools</div>
                    <div className="flex flex-wrap gap-1">
                      {blueprint.allowed_tools.map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <Label className="flex items-center gap-2"><Coins className="h-3.5 w-3.5" /> Credit cost per message</Label>
              <Input type="number" min={1} max={20} value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
              <p className="text-[11px] text-muted-foreground mt-1">
                You earn ~{(credits * 0.5).toFixed(1)} credits per message. Most agents charge 1–5 credits.
              </p>
            </div>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-3 text-xs">
                <p className="font-semibold mb-1">Submitted agents are reviewed within 24h.</p>
                <p className="text-muted-foreground">You'll get a notification once your agent is live on the marketplace.</p>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
          {step === 0 && (
            <Button onClick={generateBlueprint} disabled={generating || !brief.trim()}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
              Generate AI blueprint
            </Button>
          )}
          {step === 1 && <Button onClick={() => setStep(2)}>Continue</Button>}
          {step === 2 && (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Submit for review
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
