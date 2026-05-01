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
import { Sparkles, Loader2, Wand2, Plus, Check, Trash2 } from "lucide-react";

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
      toast({ title: "Write a longer brief", description: "Tell us what this agent should do, who it's for, and any tone notes." });
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
    const { error } = await supabase
      .from("ai_agents")
      .update({ active_prompt_variant: key })
      .eq("id", agent.id);
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
    const { error } = await supabase
      .from("ai_agents")
      .update({ prompt_variants: next })
      .eq("id", agent.id);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    setNewVariantKey("");
    setNewVariantPrompt("");
    toast({ title: `Variant ${key} added` });
    onSaved?.();
  }

  async function deleteVariant(key: string) {
    if (key === "A") return toast({ title: "Cannot delete A", description: "Variant A is the base system prompt." });
    if (key === activeVariant) return toast({ title: "Variant is live", description: "Switch to another variant first." });
    const next = { ...(agent.prompt_variants || {}) };
    delete next[key];
    const { error } = await supabase.from("ai_agents").update({ prompt_variants: next }).eq("id", agent.id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    onSaved?.();
  }

  return (
    <div className="space-y-6">
      {/* Blueprint */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" /> Blueprint from brief
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={3}
            placeholder="Describe the agent in plain language. E.g. 'A friendly career coach for first-job seekers in tech. Should help with CV review, mock interview prep, and salary expectations. Keep tone warm but practical.'"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <Button size="sm" onClick={generate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="ml-2">Generate proposal</span>
          </Button>

          {proposal && (
            <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge>{proposal.name}</Badge>
                <Badge variant="outline" className="text-[10px]">{proposal.agent_key}</Badge>
                <Badge variant="outline" className="text-[10px]">L{proposal.agent_level}</Badge>
                <Badge variant="outline" className="text-[10px]">{proposal.category}</Badge>
                <Badge variant="outline" className="text-[10px]">{proposal.connection_fee}c conn / {proposal.message_credit_cost}c msg</Badge>
              </div>
              <p className="text-xs text-muted-foreground italic">{proposal.rationale}</p>
              <div>
                <Label className="text-xs">Description</Label>
                <p className="text-sm">{proposal.description}</p>
              </div>
              <div>
                <Label className="text-xs">System prompt</Label>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-2 rounded max-h-48 overflow-auto">{proposal.system_prompt}</pre>
              </div>
              <div className="flex flex-wrap gap-1">
                {proposal.allowed_tools.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={applyProposal} disabled={applying}>
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span className="ml-1">Apply to this agent</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setProposal(null)}>Discard</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* A/B variants */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Prompt variants (A/B)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {Object.entries(variants).map(([key, prompt]) => (
              <div key={key} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={key === activeVariant ? "default" : "outline"}>Variant {key}</Badge>
                    {key === activeVariant && <span className="text-[10px] text-success-foreground">Live</span>}
                    {key === "A" && <span className="text-[10px] text-muted-foreground">(base prompt)</span>}
                  </div>
                  <div className="flex gap-1">
                    {key !== activeVariant && (
                      <Button size="sm" variant="outline" onClick={() => setActive(key)}>Make live</Button>
                    )}
                    {key !== "A" && (
                      <Button size="sm" variant="ghost" onClick={() => deleteVariant(key)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/40 p-2 rounded max-h-32 overflow-auto">{prompt}</pre>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-dashed p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Add variant</span>
            </div>
            <div className="flex gap-2">
              <Input
                className="w-24"
                placeholder="B"
                value={newVariantKey}
                onChange={(e) => setNewVariantKey(e.target.value)}
              />
              <Textarea
                rows={2}
                placeholder="New system prompt to test against the live variant…"
                value={newVariantPrompt}
                onChange={(e) => setNewVariantPrompt(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={addVariant}>Add</Button>
            <p className="text-[10px] text-muted-foreground">
              Variants run 50/50 against live traffic. Compare outcomes in Insights once enough sessions accumulate.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentBrainPanel;
