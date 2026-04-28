import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Curriculum Ingestion Node (VideoPlayer)
 * CTO Reference: Authoritative interface for visual knowledge synchronization.
 */

interface Module {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
}

interface VideoPlayerProps {
  module: Module;
  onComplete: () => void;
  isCompleted: boolean;
}

export function VideoPlayer({ module, onComplete, isCompleted }: VideoPlayerProps) {
  // PROTOCOL: Hardened Regex for YouTube ID extraction
  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&enablejsapi=1&modestbranding=1` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(module.video_url);

  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500">
      <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 text-left">
            <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors">
              {module.title}
            </CardTitle>
            {module.description && (
              <CardDescription className="text-xs font-medium italic leading-relaxed text-muted-foreground/70 uppercase tracking-widest max-w-2xl">
                {module.description}
              </CardDescription>
            )}
          </div>
          {isCompleted && (
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center gap-2 text-emerald-500 animate-in zoom-in">
              <ShieldCheck className="h-5 w-5 stroke-[2.5px]" />
              <span className="text-[10px] font-black uppercase tracking-widest">Node_Verified</span>
            </div>
          )}
        </div>

        {module.duration_minutes && (
          <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-lg bg-muted/20 w-fit border border-border/10">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {module.duration_minutes}_MIN_SYNC
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        {/* COMPONENT: VIDEO_TRAJECTORY_ARTIFACT */}
        <div className="relative aspect-video w-full overflow-hidden rounded-[24px] border-2 border-border/20 bg-black shadow-inner group">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={module.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/10">
              <Zap className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
                Registry_Empty: Awaiting_Data_Ingress
              </p>
            </div>
          )}
        </div>

        {/* ACTION: FINAL_SYNCHRONIZATION */}
        {!isCompleted && (
          <Button
            onClick={onComplete}
            className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest shadow-[0_10px_30px_rgba(var(--primary),0.3)] transition-all active:scale-[0.98] gap-3"
          >
            <Zap className="h-5 w-5 fill-current" />
            SYNCHRONIZE_VERIFICATION
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
