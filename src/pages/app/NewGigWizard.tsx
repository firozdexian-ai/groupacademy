import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function NewGigWizard() {
  const navigate = useNavigate();
  const [rawAsk, setRawAsk] = useState("");
  const [brief, setBrief] = useState<any | null>(null);
  const [draft, setDraft] = useState<any | null>(null);

  const scope = useMutation({
    mutationFn: async (payload: { brief_id?: string; raw_ask?: string }) => {
      const { data, error } = await supabase.functions.invoke("ai-gig-scoper", { body: payload });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { brief: any; draft: any };
    },
    onSuccess: (data) => {
      setBrief(data.brief);
      setDraft(data.draft);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to scope"),
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("no draft");
      const { data, error } = await supabase.rpc("publish_gig_from_draft", { _draft_id: draft.id });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (newId) => {
      toast.success("Gig submitted for review");
      navigate(`/app/gigs?tab=projects&new=${newId}`);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to publish"),
  });

  return (
    <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto safe-bottom">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Post a gig</h1>
      </div>

      <Card className="p-3 space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Describe what you need</Label>
        <Textarea
          rows={4}
          placeholder='e.g. "I need 10 product images for my Shopify store, lifestyle background, white sneakers."'
          value={rawAsk}
          onChange={(e) => setRawAsk(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">AI will draft scope, deliverables, and a fair credit price.</p>
          <Button
            size="sm"
            disabled={rawAsk.trim().length < 8 || scope.isPending}
            onClick={() => scope.mutate({ raw_ask: rawAsk.trim() })}
          >
            {scope.isPending ? <Skeleton className="h-4 w-16" /> : <><Sparkles className="h-4 w-4 mr-1" /> Scope with AI</>}
          </Button>
        </div>
      </Card>

      {scope.isPending && <Skeleton className="h-48 w-full" />}

      {draft && (
        <Card className="p-3 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Badge variant="outline" className="capitalize">{draft.recommended_kind}</Badge>
              <h2 className="font-bold mt-2 text-base">{draft.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{draft.description}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0"
              disabled={scope.isPending}
              onClick={() => brief && scope.mutate({ brief_id: brief.id })}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-muted/40 p-2">
              <div className="text-muted-foreground">Estimated credits</div>
              <div className="font-bold text-base">{draft.estimated_credits} cr</div>
            </div>
            <div className="rounded-md bg-muted/40 p-2">
              <div className="text-muted-foreground">Suggested deadline</div>
              <div className="font-bold text-base">{draft.suggested_deadline_days}d</div>
            </div>
          </div>

          {draft.deliverables?.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Deliverables</div>
              <ul className="text-sm space-y-1 list-disc pl-5">
                {draft.deliverables.map((d: string, i: number) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}

          {draft.acceptance_criteria?.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Acceptance criteria</div>
              <ul className="text-sm space-y-1 list-disc pl-5">
                {draft.acceptance_criteria.map((d: string, i: number) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}

          {draft.required_skills?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {draft.required_skills.map((s: string) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          )}

          {draft.rationale && (
            <div className="text-xs text-muted-foreground italic border-l-2 pl-2">{draft.rationale}</div>
          )}

          <Button className="w-full" disabled={publish.isPending} onClick={() => publish.mutate()}>
            <Send className="h-4 w-4 mr-1" /> Publish gig
          </Button>
        </Card>
      )}
    </div>
  );
}
