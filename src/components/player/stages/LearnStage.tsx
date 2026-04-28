import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceViewer } from "../ResourceViewer";
import { CheckCircle, BookOpen, FileText, Network, Zap, ShieldCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Core Learning Node (LearnStage)
 * CTO Reference: Authoritative gateway for structured slide and mindmap ingestion.
 */

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface LearnStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
}

export function LearnStage({ resources, onComplete, isCompleted }: LearnStageProps) {
  const [slidesViewed, setSlidesViewed] = useState(false);
  const [mindmapViewed, setMindmapViewed] = useState(false);

  const slidesResource = resources.find((r) => r.resource_type === "slides");
  const mindmapResource = resources.find((r) => r.resource_type === "mindmap");

  // PROTOCOL: Engagement Validation
  const canComplete = slidesViewed || (!slidesResource && mindmapViewed) || resources.length === 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* HUD: STAGE_HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-foreground">
            <BookOpen className="h-6 w-6 text-primary" /> Stage_02: Knowledge_Ingestion
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Synchronize with structured slides and cognitive mindmaps
          </p>
        </div>
        {isCompleted && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center gap-2 text-emerald-500 shadow-lg">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Node_Verified</span>
          </div>
        )}
      </div>

      {resources.length === 0 ? (
        <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[40px] p-24 text-center">
          <div className="flex flex-col items-center gap-6">
            <Zap className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
              Registry_Empty: Awaiting_Learning_Artifacts
            </p>
            <Button
              onClick={onComplete}
              className="h-12 px-10 rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-2xl"
            >
              Sync_Next_Stage
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* COMPONENT: STRUCTURED_SLIDES */}
          {slidesResource && (
            <Card
              className={cn(
                "rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden transition-all duration-500",
                slidesViewed
                  ? "border-emerald-500/20 shadow-emerald-500/5"
                  : "hover:border-primary/20 hover:shadow-2xl",
              )}
            >
              <CardHeader className="p-6 pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  {slidesResource.title}
                  {slidesViewed && <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {slidesResource.resource_url && (
                  <div onClick={() => setSlidesViewed(true)} className="cursor-pointer">
                    <ResourceViewer type="slides" url={slidesResource.resource_url} title={slidesResource.title} />
                  </div>
                )}
                {slidesResource.description && (
                  <div className="p-6 bg-muted/5 border-t border-border/10">
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed italic opacity-70">
                      {slidesResource.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* COMPONENT: COGNITIVE_MINDMAP */}
          {mindmapResource && (
            <Card
              className={cn(
                "rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden transition-all duration-500",
                mindmapViewed
                  ? "border-emerald-500/20 shadow-emerald-500/5"
                  : "hover:border-primary/20 hover:shadow-2xl",
              )}
            >
              <CardHeader className="p-6 pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                    <Network className="h-4 w-4" />
                  </div>
                  {mindmapResource.title}
                  {mindmapViewed && <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {mindmapResource.resource_url && (
                  <div onClick={() => setMindmapViewed(true)} className="cursor-pointer">
                    <ResourceViewer type="mindmap" url={mindmapResource.resource_url} title={mindmapResource.title} />
                  </div>
                )}
                {mindmapResource.description && (
                  <div className="p-6 bg-muted/5 border-t border-border/10">
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed italic opacity-70">
                      {mindmapResource.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* FOOTER: ACTION_INGRESS */}
      {!isCompleted && resources.length > 0 && (
        <div className="flex justify-end pt-4 border-t-2 border-border/10">
          <Button
            onClick={onComplete}
            disabled={!canComplete}
            className="h-14 px-10 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-2xl active:scale-95 transition-all gap-3"
          >
            {canComplete ? <Zap className="h-5 w-5 fill-current" /> : <FileText className="h-5 w-5" />}
            {canComplete ? "AUTHORIZE_CONTINUE" : "SYNC_REQUIRED: VIEW_PRIMARY_ARTIFACTS"}
          </Button>
        </div>
      )}
    </div>
  );
}
