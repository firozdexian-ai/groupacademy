// Phase 7 — Agent Brain panel.
// Two tools:
//  1) Blueprint: plain-language brief → AI proposes a full agent config.
//     Admin reviews a diff and can Apply (writes to ai_agents).
//  2) A/B prompt variants: store multiple system_prompt variants in
//     ai_agents.prompt_variants (jsonb), pick the active one. The runtime
//     already reads `active_prompt_variant` to select which to send.

import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Loader2,
  Wand2,
  Plus,
  Check,
  Trash2,
  BrainCircuit,
  SplitSquareHorizontal,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Proposal {
  name: string;
  agent_key: string;
  description: string;
  system_prompt: string;
  allowed_tools: string[];
  agent_level: number;
  connection_fee: number;
  message_credit_cost: number;
  category: string;
  rationale: string;
}

interface AgentBrainPanelProps {
  agent: {
    id: string;
    name: string;
    agent_key: string;
    description: string;
    system_prompt: string;
    allowed_tools: string[];
    agent_level: number;
    connection_fee: number;
    message_credit_cost: number;
    category: string;
    audience: string;
    active_prompt_variant: string;
    prompt_variants: Record<string, string>;
  };
  onSaved?: () => void;
}

export function AgentBrainPanel({ agent, onSaved }: AgentBrainPanelProps) {
  const { toast } = useToast();
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [applying, setApplying] = useState(false);

  const variants = useMemo<Record<string, string>>(
    () => ({ A: agent.system_prompt, ...(agent.prompt_variants || {}) }),
    [agent],
  );
  const [activeVariant, setActiveVariant] = useState(agent.active_prompt_variant || "A");
  const [newVariantKey, setNewVariantKey] = useState("");
  const [newVariantPrompt, setNewVariantPrompt] = useState("");

  async function generate() {
    if (brief.trim().length < 10) {
      toast({
        title: "Write a longer brief",
        description: "Tell us what this agent should do, who it's for, and any tone notes.",
      });
      return;
    }
    setGenerating(true);
    setProposal(null);
    try {
      const { data, error } = await supabase.functions.invoke("agent-blueprint", {
        body: { brief, audience: agent.audience },
      });
      if (error) throw error;
      if (!data?.proposal) throw new Error("No proposal returned");
      setProposal(data.proposal as Proposal);
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message || String(e), variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function applyProposal() {
    if (!proposal) return;
    setApplying(true);
    const { error } = await supabase
      .from("ai_agents")
      .update({
        name: proposal.name,
        description: proposal.description,
        system_prompt: proposal.system_prompt,
        allowed_tools: proposal.allowed_tools,
        agent_level: proposal.agent_level,
        connection_fee: proposal.connection_fee,
        message_credit_cost: proposal.message_credit_cost,
        category: proposal.category,
      })
      .eq("id", agent.id);
    setApplying(false);
    if (error) {
      toast({ title: "Apply failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Blueprint applied" });
    setProposal(null);
    setBrief("");
    onSaved?.();
  }

  async function setActive(key: string) {
    const { error } = await supabase.from("ai_agents").update({ active_prompt_variant: key }).eq("id", agent.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setActiveVariant(key);
    toast({ title: `Variant ${key} is now live` });
    onSaved?.();
  }

  async function addVariant() {
    const key = newVariantKey.trim().toUpperCase();
    if (!key || !/^[A-Z0-9]{1,4}$/.test(key)) {
      return toast({ title: "Invalid key", description: "Use 1-4 uppercase letters/digits (e.g. B, B2)." });
    }
    if (key === "A" || variants[key]) {
      return toast({ title: "Variant exists", description: "Pick a different key." });
    }
    if (newVariantPrompt.trim().length < 20) {
      return toast({ title: "Prompt too short" });
    }
    const next = { ...(agent.prompt_variants || {}), [key]: newVariantPrompt };
    const { error } = await supabase.from("ai_agents").update({ prompt_variants: next }).eq("id", agent.id);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    setNewVariantKey("");
    setNewVariantPrompt("");
    toast({ title: `Variant ${key} added` });
    onSaved?.();
  }

  async function deleteVariant(key: string) {
    if (key === "A") return toast({ title: "Cannot delete A", description: "Variant A is the base system prompt." });
    if (key === activeVariant)
      return toast({ title: "Variant is live", description: "Switch to another variant first." });
    const next = { ...(agent.prompt_variants || {}) };
    delete next[key];
    const { error } = await supabase.from("ai_agents").update({ prompt_variants: next }).eq("id", agent.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    onSaved?.();
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Blueprint Generation */}
      <Card className="rounded-[40px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-primary to-blue-500" />
        <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] italic flex items-center gap-3 text-primary">
            <BrainCircuit className="h-5 w-5" /> Blueprint Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">
              Agent Brief
            </Label>
            <Textarea
              rows={4}
              placeholder="Describe the agent in plain language. E.g. 'A friendly career coach for first-job seekers in tech. Should help with CV review, mock interview prep, and salary expectations. Keep tone warm but practical.'"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="rounded-3xl border-2 bg-background/50 font-medium p-6 italic focus:border-primary/40 transition-all text-sm"
            />
            <div className="flex justify-end">
              <Button
                onClick={generate}
                disabled={generating || brief.trim().length < 10}
                className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 gap-2"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generate Proposal
              </Button>
            </div>
          </div>

          {proposal && (
            <div className="rounded-[32px] border-2 border-primary/20 p-8 space-y-6 bg-primary/5 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-primary text-white font-black uppercase tracking-widest px-3 py-1">
                  {proposal.name}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-background">
                  {proposal.agent_key}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-black uppercase tracking-widest bg-background border-border/50"
                >
                  L{proposal.agent_level}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-black uppercase tracking-widest bg-background border-border/50"
                >
                  {proposal.category}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                >
                  {proposal.connection_fee}c CONN / {proposal.message_credit_cost}c MSG
                </Badge>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-muted-foreground italic border-l-2 border-primary/40 pl-4 py-1">
                  "{proposal.rationale}"
                </p>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                    Description
                  </Label>
                  <p className="text-sm font-medium">{proposal.description}</p>
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                    System Prompt
                  </Label>
                  <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-6 rounded-3xl border-2 border-border/20 max-h-64 overflow-auto shadow-inner">
                    {proposal.system_prompt}
                  </pre>
                </div>

                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">
                    Authorized Tools
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {proposal.allowed_tools.map((t) => (
                      <Badge key={t} variant="secondary" className="font-mono text-[9px]">
                        {t}
                      </Badge>
                    ))}
                    {proposal.allowed_tools.length === 0 && (
                      <span className="text-xs text-muted-foreground italic">None required</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-border/20">
                <Button
                  onClick={applyProposal}
                  disabled={applying}
                  className="h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2"
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Apply Blueprint To Agent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setProposal(null)}
                  className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-2"
                >
                  Discard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* A/B Prompt Variants */}
      <Card className="rounded-[40px] border-2 border-border/40 shadow-xl overflow-hidden bg-card/30 backdrop-blur-xl flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
        <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] italic flex items-center gap-3 text-emerald-600">
            <SplitSquareHorizontal className="h-5 w-5" /> Prompt Variants (A/B Testing)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            {Object.entries(variants).map(([key, prompt]) => (
              <div
                key={key}
                className={cn(
                  "rounded-[24px] border-2 p-6 transition-all duration-300",
                  key === activeVariant
                    ? "border-emerald-500/30 bg-emerald-500/5 shadow-sm"
                    : "border-border/20 bg-background/30 hover:border-border/40",
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={key === activeVariant ? "default" : "outline"}
                      className={cn(
                        "font-black text-[10px] uppercase tracking-widest px-3 py-1",
                        key === activeVariant && "bg-emerald-500 text-white",
                      )}
                    >
                      Variant {key}
                    </Badge>
                    {key === activeVariant && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                      </span>
                    )}
                    {key === "A" && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                        (Base Prompt)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {key !== activeVariant && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActive(key)}
                        className="h-8 rounded-lg font-black uppercase text-[9px] tracking-widest px-4"
                      >
                        Make Live
                      </Button>
                    )}
                    {key !== "A" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteVariant(key)}
                        className="h-8 w-8 rounded-lg text-destructive/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-background/50 p-4 rounded-2xl border border-border/10 max-h-48 overflow-auto shadow-inner text-foreground/80">
                  {prompt}
                </pre>
              </div>
            ))}
          </div>

          <div className="rounded-[32px] border-2 border-dashed border-border/40 p-6 space-y-6 bg-muted/5">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Plus className="h-5 w-5" />
              <span className="text-sm font-black uppercase tracking-widest italic">Add Experimental Variant</span>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="space-y-2 md:w-32 shrink-0">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Key
                </Label>
                <Input
                  className="h-12 rounded-xl border-2 font-black text-center"
                  placeholder="B"
                  value={newVariantKey}
                  onChange={(e) => setNewVariantKey(e.target.value)}
                  maxLength={4}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  System Prompt
                </Label>
                <Textarea
                  rows={3}
                  className="rounded-xl border-2 font-mono text-xs p-4 resize-none"
                  placeholder="New system prompt to test against the live variant…"
                  value={newVariantPrompt}
                  onChange={(e) => setNewVariantPrompt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 max-w-sm leading-relaxed">
                Variants run 50/50 against live traffic. Compare session completion rates in Insights.
              </p>
              <Button
                onClick={addVariant}
                disabled={!newVariantKey.trim() || newVariantPrompt.trim().length < 20}
                className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md"
              >
                Inject Variant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentBrainPanel;
