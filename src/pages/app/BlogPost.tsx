import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  User,
  Calendar,
  Tag,
  Share2,
  Eye,
  ExternalLink,
  Zap,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Knowledge Artifact Viewport
 * High-fidelity editorial reader with cross-registry telemetry and neural CTAs.
 * 2026 Standard: Executive Logic typography with immersive spatial geometry.
 */
export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Increment view count: Registry Telemetry
  const viewMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("blog_posts")
        .update({ views: (post?.views || 0) + 1 })
        .eq("id", postId);
      if (error) throw error;
    },
  });

  useEffect(() => {
    if (post?.id) {
      viewMutation.mutate(post.id);
    }
  }, [post?.id]);

  const handleShare = async () => {
    const shareUrl = post?.external_url || window.location.href;
    try {
      await navigator.share({
        title: post?.title,
        text: post?.excerpt || "",
        url: shareUrl,
      });
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Artifact link secured to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 animate-pulse">
        <Skeleton className="h-12 w-3/4 rounded-xl bg-muted/40" />
        <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full bg-muted/40" />
          <Skeleton className="h-4 w-full bg-muted/40" />
          <Skeleton className="h-4 w-2/3 bg-muted/40" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-24 text-center animate-in fade-in zoom-in-95">
        <div className="h-20 w-20 rounded-[32px] bg-muted/10 flex items-center justify-center mx-auto mb-8 border border-border/40 rotate-3">
          <Target className="h-10 w-10 text-muted-foreground/20" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Artifact Not Found</h2>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic mb-8">
          Registry entry may have been purged or is pending sync.
        </p>
        <Button
          variant="outline"
          className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2"
          onClick={() => navigate("/app/learning/blog")}
        >
          <ArrowLeft className="mr-3 h-4 w-4" /> Revert to Registry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Navigation & Header */}
      <header className="space-y-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/learning/blog")}
          className="group rounded-xl h-11 px-4 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 -ml-4"
        >
          <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Insights
        </Button>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
              {post.category || "General Logic"}
            </Badge>
            {post.tags?.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-muted/50 text-muted-foreground/60 border-none px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest gap-1.5"
              >
                <Tag className="h-3 w-3" /> {tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9] selection:bg-primary/20">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic">
            <span className="flex items-center gap-2 text-primary">
              <User className="h-3.5 w-3.5" /> {post.author_name || "Platform Architect"}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" /> {format(new Date(post.published_at), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> {post.reading_time_mins || 5} Min Read
            </span>
            <span className="flex items-center gap-2">
              <Eye className="h-3.5 w-3.5" /> {post.views} Logic Syncs
            </span>
          </div>
        </div>
      </header>

      {/* Featured Image Node */}
      {post.featured_image && (
        <div className="aspect-video relative rounded-[40px] overflow-hidden shadow-2xl bg-black border border-border/40 group">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Primary Narrative Viewport */}
      <main className="grid lg:grid-cols-[1fr,240px] gap-12 items-start">
        <div className="space-y-10">
          {post.excerpt && (
            <div className="p-8 rounded-[32px] bg-primary/5 border-l-8 border-primary shadow-inner">
              <p className="text-xl text-foreground font-bold italic leading-relaxed tracking-tight">{post.excerpt}</p>
            </div>
          )}

          <article
            className={cn(
              "prose prose-neutral dark:prose-invert max-w-none",
              "prose-p:text-lg prose-p:leading-relaxed prose-p:font-medium prose-p:text-foreground/80",
              "prose-strong:font-black prose-strong:text-foreground prose-strong:italic",
              "prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-headings:italic",
            )}
          >
            {post.external_url ? (
              <Card className="rounded-[32px] border-2 border-dashed border-border/40 bg-card/30 backdrop-blur-xl py-16 text-center animate-in zoom-in-95">
                <CardContent className="space-y-6">
                  <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/20 rotate-3">
                    <ExternalLink className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Remote Content Node</h3>
                    <p className="text-[11px] font-bold text-muted-foreground/60 max-w-xs mx-auto uppercase tracking-widest italic">
                      This intelligence artifact is hosted on an external registry. Initialize handshake to read.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all active:scale-95"
                    onClick={() => window.open(post.external_url, "_blank", "noopener,noreferrer")}
                  >
                    Open Registry Link <Zap className="ml-3 h-4 w-4 fill-current" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div
                className="selection:bg-primary/20"
                dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, "<br/>") || "" }}
              />
            )}
          </article>

          <Separator className="bg-border/40" />

          {/* Engagement Handshake */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              className="rounded-xl h-11 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-3"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4 text-primary" /> Broadcast Artifact
            </Button>

            <Button
              variant="ghost"
              className="font-black uppercase text-[10px] tracking-[0.3em] hover:bg-primary/5"
              onClick={() => navigate("/app/learning/blog")}
            >
              Explore More <ArrowRight className="ml-3 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sidebar: Strategic CTAs */}
        <aside className="sticky top-10 space-y-6">
          <Card
            className="rounded-[32px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden group cursor-pointer hover:border-primary/40 transition-all"
            onClick={() => navigate("/app/agents")}
          >
            <CardContent className="p-8 space-y-6 text-center">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 -rotate-3 transition-transform group-hover:rotate-0">
                <Zap className="h-6 w-6 text-primary fill-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black uppercase tracking-widest text-[11px]">Neural Coaching</h4>
                <p className="text-[9px] font-bold text-muted-foreground/60 uppercase italic">Apply these insights</p>
              </div>
              <Button
                size="sm"
                className="w-full rounded-xl font-black uppercase text-[9px] h-10 tracking-widest shadow-lg"
              >
                Talk to AI
              </Button>
            </CardContent>
          </Card>

          <div className="p-6 rounded-2xl bg-muted/20 border border-border/40 space-y-3">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground/40">
              <ShieldCheck className="h-3 w-3" /> Artifact Status
            </div>
            <p className="text-[10px] font-bold text-foreground/60 italic leading-tight">
              Verified intelligence artifact. Logic version sync 2026.4.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
