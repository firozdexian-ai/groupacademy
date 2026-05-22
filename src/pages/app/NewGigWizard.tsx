import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { publishGigFromDraft } from "@/domains/gigs/repo/gigsRepo";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw, Send, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { aiGigScoper } from "@/domains/gigs/api/gigsApi";

// Production interfaces aligned with DB schema[cite: 4, 8]
interface GigBrief {
  id: string;
  raw_ask: string;
}

interface GigDraft {
  id: string;
  title: string;
  description: string;
  recommended_kind: string;
  estimated_credits: number;
  suggested_deadline_days: number;
  deliverables: string[];
  acceptance_criteria: string[];
  required_skills: string[];
  rationale?: string;
}

export default function NewGigWizard() {
  const navigate = useNavigate();
  const [rawAsk, setRawAsk] = useState("");
  const [brief, setBrief] = useState<GigBrief | null>(null);
  const [draft, setDraft] = useState<GigDraft | null>(null);

  // Digital Workforce Hook: Placeholder for Admin Agent interaction[cite: 6]
  const notifyAdminAgent = async (message: string, context: any) => {
    // In production, this invokes the 'admin-gig-ops' agent
    console.log("Notifying Digital Workforce Agent:", message, context);
  };

  const scope = useMutation({
    mutationFn: async (payload: { brief_id?: string; raw_ask?: string }) => {
      const data = await aiGigScoper(payload);
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as unknown as { brief: GigBrief; draft: GigDraft };
    },
    onSuccess: (data) => {
      setBrief(data.brief);
      setDraft(data.draft);
      toast.success("AI scoping complete");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Failed to scope gig");
      notifyAdminAgent("Gig Scoping Failure", { error: e.message });
    },
  });

  const publish = useMutation({
    mutationFn: async () => {
      if (!draft) throw new Error("No draft available");
      return await publishGigFromDraft(draft.id);
    },
    onSuccess: (newId) => {
      toast.success("Gig submitted for review");
      navigate(`/app/gigs?tab=projects&new=${newId}`);
    },
    onError: (e: Error) => {
      toast.error("Failed to publish");
      notifyAdminAgent("Gig Publishing Failure", { draftId: draft?.id, error: e.message });
    },
  });

  return (
    <div className="px-4 py-4 space-y-6 max-w-2xl mx-auto safe-bottom">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">Post a gig</h1>
      </div>

      <Card className="p-4 space-y-4 shadow-sm border-slate-200">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Describe what you need
          </Label>
          <Textarea
            rows={4}
            className="resize-none focus:ring-2 focus:ring-blue-500/20"
            placeholder='e.g. "I need 10 product images for my Shopify store, lifestyle background, white sneakers."'
            value={rawAsk}
            onChange={(e) => setRawAsk(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground leading-tight">
            AI will draft scope, deliverables, and a fair credit price.
          </p>
          <Button
            size="sm"
            disabled={rawAsk.trim().length < 8 || scope.isPending}
            onClick={() => scope.mutate({ raw_ask: rawAsk.trim() })}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {scope.isPending ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" /> Scope with AI
              </>
            )}
          </Button>
        </div>
      </Card>

      {scope.isPending && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {draft && !scope.isPending && (
        <Card className="p-5 space-y-4 border-blue-100 bg-blue-50/30">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-700 hover:bg-blue-200">
                {draft.recommended_kind}
              </Badge>
              <h2 className="font-bold mt-2 text-lg text-slate-900">{draft.title}</h2>
              <p className="text-sm text-slate-600 mt-1">{draft.description}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-slate-500"
              disabled={scope.isPending}
              onClick={() => brief && scope.mutate({ brief_id: brief.id })}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Estimated credits</div>
              <div className="font-bold text-lg text-blue-700">{draft.estimated_credits} cr</div>
            </div>
            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Suggested deadline</div>
              <div className="font-bold text-lg text-slate-900">{draft.suggested_deadline_days}d</div>
            </div>
          </div>

          {draft.deliverables?.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Deliverables</div>
              <ul className="text-sm text-slate-700 space-y-0.5 list-disc pl-4">
                {draft.deliverables.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {draft.required_skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {draft.required_skills.map((s) => (
                <Badge key={s} variant="outline" className="text-[11px] bg-white border-slate-200 text-slate-600">
                  {s}
                </Badge>
              ))}
            </div>
          )}

          <Button
            className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg mt-4"
            disabled={publish.isPending}
            onClick={() => publish.mutate()}
          >
            <Send className="h-4 w-4 mr-2" /> Publish gig
          </Button>
        </Card>
      )}
    </div>
  );
}
