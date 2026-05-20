import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";

// UI Primitive Matrix Registries
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Bot, Send, Loader2, ShieldCheck, Coins, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { agentBlueprint } from "@/domains/agents/api/agentsApi";

interface CreatorOnboardingDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

interface BlueprintPayload {
  system_prompt?: string;
  allowed_tools?: string[];
  description?: string;
}

const STEPS = ["Logic_Brief", "AI_Brain", "Deployment"];

/**
 * GroUp Academy: AI Agent Creator Onboarding Studio (V5.6.0)
 * CTO Reference: High-performance modal wizard managing secure agent registry provisions.
 * Architecture: Optimized via TanStack Mutation Hooks with structural overlay interaction locks.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function CreatorOnboardingDialog({ open, onOpenChange, onCreated }: CreatorOnboardingDialogProps) {
  const { talent } = useTalent();
  const qc = useQueryClient();

  const [step, setStep] = useState<number>(0);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [blueprint, setBlueprint] = useState<BlueprintPayload | null>(null);
  const [credits, setCredits] = useState(2);

  const progress = ((step + 1) / STEPS.length) * 100;

  const reset = () => {
    setStep(0);
    setName("");
    setBrief("");
    setBlueprint(null);
    setCredits(2);
  };

  // --- ACTION: NEURAL_BLUEPRINT_SYNTHESIS_MUTATION ---
  const blueprintMutation = useMutation({
    mutationKey: ["synthesize-agent-blueprint"],
    mutationFn: async (): Promise<BlueprintPayload> => {
      if (!brief.trim() || brief.length < 20) {
        throw new Error("INSUFFICIENT_CONTEXT: Brief payload requires length >= 20 characters.");
      }

      // HUD: INVOKING_AGENT_BLUEPRINT_EDGE_ENGINE
      const data: any = await agentBlueprint({ brief: brief.trim(), name: name.trim() || "New Agent Entity" });
      return (data?.blueprint ?? data ?? null) as BlueprintPayload;
    },
    onSuccess: (generatedBlueprint) => {
      setBlueprint(generatedBlueprint);
      setStep(1);
    },
    onError: (err: any) => {
      console.warn(
        "[Digital Workforce] WARNING: Neural link unstable. Bypassing to manual logic fallback mode.",
        err.message,
      );
      toast.warning("Neural link unstable. Bypassing to manual logic mode.");

      setBlueprint({
        system_prompt: brief.trim(),
        allowed_tools: [],
        description: brief.trim().slice(0, 140),
      });
      setStep(1);
    },
  });

  // --- ACTION: AGENT_REGISTRY_COMMIT_MUTATION ---
  const submitMutation = useMutation({
    mutationKey: ["commit-agent-to-marketplace"],
    mutationFn: async (): Promise<void> => {
      if (!talent?.id) throw new Error("IDENTITY_SYNC_REQUIRED");
      if (!name.trim()) throw new Error("DESIGNATION_REQUIRED");

      // Hardened slug generation to prevent character URL routing breaks
      const safeSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
      const uniqueSlug = `${safeSlug}-${Math.random().toString(36).slice(2, 6)}`;

      // HUD: COMMITTING_AGENT_RECORD_INSERTION
      const { error } = await supabase.from("ai_agents").insert({
        agent_key: uniqueSlug,
        name: name.trim(),
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

      if (error) {
        // Digital Workforce Anomaly Trigger: Imprints explicit failure trace parameters
        console.error("[Digital Workforce] ANOMALY: ai_agents ledger entry validation failure.", {
          talentId: talent.id,
          agentKey: uniqueSlug,
          message: error.message,
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Agent Artifact Submitted", {
        description: "Marketplace verification protocol is currently pending review within 24 hours.",
      });

      // Universally sync data collections across query stores
      void qc.invalidateQueries({ queryKey: ["ai-agents"] });
      void qc.invalidateQueries({ queryKey: ["talent-profile"] });

      if (onCreated) onCreated();
      onOpenChange(false);
      reset();
    },
    onError: (err: Error) => {
      toast.error(
        err.message === "IDENTITY_SYNC_REQUIRED" ? "Identity Sync Required." : `Ingress Failed: ${err.message}`,
      );
    },
  });

  const isPendingGlobalState = blueprintMutation.isPending || submitMutation.isPending;

  const handleOpenToggle = (nextOpenState: boolean) => {
    if (isPendingGlobalState) return; // Freeze view transformations securely during background data transits
    onOpenChange(nextOpenState);
    if (!nextOpenState) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenToggle}>
      <DialogContent
        // Enforce hard pointer bounds to completely eliminate backdrop exit click disruptions
        onPointerDownOutside={(e) => isPendingGlobalState && e.preventDefault()}
        onEscapeKeyDown={(e) => isPendingGlobalState && e.preventDefault()}
        className="max-w-2xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl select-none"
      >
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

        <div className="p-8 max-h-[85vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="mb-6 text-left">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                  Creator Studio
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
                  Initialize Custom AI Entity
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 mb-8">
            <Progress value={progress} className="h-2 bg-primary/10" />
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
              {STEPS.map((stepName, i) => (
                <span key={stepName} className={cn("transition-colors", i === step && "text-primary")}>
                  PHASE_0{i + 1}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-8 text-left">
            {/* PHASE 1: BRIEFING INPUT LOGIC */}
            {step === 0 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Entity Designation
                  </Label>
                  <Input
                    value={name}
                    disabled={isPendingGlobalState}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Resume Polisher"
                    maxLength={50}
                    className="h-14 rounded-2xl border-2 bg-muted/20 font-bold text-lg px-4 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Logic Parameters
                  </Label>
                  <Textarea
                    value={brief}
                    disabled={isPendingGlobalState}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Describe your agent's purpose, audience, and what makes it special. The more detail, the better the AI blueprint."
                    rows={6}
                    className="rounded-2xl border-2 bg-muted/20 font-medium italic p-4 resize-none disabled:opacity-50"
                  />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 text-right mt-1">
                    {brief.length} / 1000 Bytes
                  </p>
                </div>
                <Card className="bg-primary/5 border-2 border-primary/20 rounded-2xl">
                  <CardContent className="p-4 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">
                      You earn <strong className="text-primary font-black">50% of the credits</strong> spent on every
                      conversation with your agent. Payouts initiate upon marketplace verification.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PHASE 2: SYNTHESIZED BLUEPRINT REVIEW */}
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center mb-6">
                  Neural Blueprint Synthesized. Refinement available post-deployment.
                </p>
                <Card className="rounded-[24px] border-2 border-border/40 bg-card/40 backdrop-blur-sm shadow-inner">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="font-black uppercase tracking-widest text-[9px] text-primary mb-2 flex items-center gap-2">
                        <Bot className="h-3 w-3" /> Core Logic Prompt
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/20 text-xs font-mono text-foreground/70 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                        {blueprint?.system_prompt ?? brief}
                      </div>
                    </div>
                    {blueprint?.allowed_tools && blueprint.allowed_tools.length > 0 && (
                      <div className="pt-4 border-t border-border/10">
                        <div className="font-black uppercase tracking-widest text-[9px] text-primary mb-2 flex items-center gap-2">
                          <Zap className="h-3 w-3" /> Authorized Tooling
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {blueprint.allowed_tools.map((toolName) => (
                            <Badge
                              key={toolName}
                              variant="secondary"
                              className="text-[9px] font-black uppercase tracking-widest bg-background border-2"
                            >
                              {toolName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* PHASE 3: BILLING ARTIFACT DEPLOYMENT CONSTRAINTS */}
            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-4 bg-muted/20 p-6 rounded-[24px] border-2 border-border/40">
                  <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Coins className="h-4 w-4" /> Message Cost Yield (Credits)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    disabled={isPendingGlobalState}
                    value={credits}
                    onChange={(e) => setCredits(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                    className="h-16 rounded-2xl border-2 bg-background font-black text-2xl px-6 disabled:opacity-50"
                  />
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground/60">Creator Yield Rate:</span>
                    <span className="text-emerald-500">~{(credits * 0.5).toFixed(1)} TKN / Msg</span>
                  </div>
                </div>

                <Card className="bg-amber-500/5 border-2 border-amber-500/20 rounded-[24px]">
                  <CardContent className="p-6 text-sm text-center italic font-medium text-foreground/80">
                    <p className="mb-1 text-amber-600 font-black not-italic uppercase tracking-widest text-[10px]">
                      Verification Protocol
                    </p>
                    <p>
                      Submitted artifacts undergo security review within 24 hours. You will receive telemetry once the
                      entity is active on the marketplace.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* WINDOW FOOTER INTERFACE ACTIONS CONTAINER */}
          <DialogFooter className="mt-10 gap-3 sm:gap-0 border-t border-border/10 pt-6 flex-col sm:flex-row">
            {step > 0 && (
              <Button
                variant="outline"
                type="button"
                disabled={isPendingGlobalState}
                onClick={() => setStep((s) => s - 1)}
                className="h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest w-full sm:w-auto px-8"
              >
                Revert Phase
              </Button>
            )}

            {step === 0 && (
              <Button
                type="button"
                onClick={() => blueprintMutation.mutate()}
                disabled={blueprintMutation.isPending || !brief.trim() || !name.trim()}
                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest w-full shadow-xl shadow-primary/20"
              >
                {blueprintMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Bot className="h-4 w-4 mr-2" />
                )}
                {blueprintMutation.isPending ? "Synthesizing Core Parameters..." : "Synthesize Blueprint"}
              </Button>
            )}

            {step === 1 && (
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest w-full sm:flex-1 shadow-xl shadow-primary/20"
              >
                Confirm Parameters
              </Button>
            )}

            {step === 2 && (
              <Button
                type="button"
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest w-full sm:flex-1 shadow-xl shadow-primary/20"
              >
                {submitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {submitMutation.isPending ? "Configuring Marketplace Channels..." : "Commit to Marketplace"}
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
