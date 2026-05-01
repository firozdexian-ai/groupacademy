import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Clock, ArrowLeft, User, Calendar, Tag, Share2, Eye, ExternalLink, Sparkles,
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
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL, META_TEXT, CARD } from "@/lib/uiTokens";

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts").select("*").eq("slug", slug).eq("status", "published").single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const viewMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from("blog_posts").update({ views: (post?.views || 0) + 1 }).eq("id", postId);
    },
  });

  useEffect(() => { if (post?.id) viewMutation.mutate(post.id); }, [post?.id]);

  const handleShare = async () => {
    const shareUrl = post?.external_url || window.location.href;
    try {
      await navigator.share({ title: post?.title, text: post?.excerpt || "", url: shareUrl });
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    }
  };

  if (isLoading) {
    return (
      <div className={PAGE_SHELL}>
        <Skeleton className="h-8 w-3/4 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className={PAGE_SHELL}>
        <EmptyState
          title="Article not found"
          description="This article may have been removed."
          action={{ label: "Back to Insights", onClick: () => navigate("/app/learning/blog") }}
        />
      </div>
    );
  }

  return (
    <div className={PAGE_SHELL}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning/blog")} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <header className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {post.category && <Badge variant="outline" className="text-[10px]">{post.category}</Badge>}
          {post.tags?.map((tag: string) => (
            <Badge key={tag} variant="outline" className="text-[10px] gap-1">
              <Tag className="h-2.5 w-2.5" /> {tag}
            </Badge>
          ))}
        </div>

        <h1 className="text-2xl font-bold leading-tight">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {post.author_name && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author_name}</span>
          )}
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {format(new Date(post.published_at), "MMM d, yyyy")}
            </span>
          )}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.reading_time_mins || 5}m read</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views || 0}</span>
        </div>
      </header>

      {post.featured_image && (
        <div className="aspect-video rounded-2xl overflow-hidden border border-border/40">
          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {post.excerpt && (
        <Card className={cn(CARD, "border-l-4 border-l-primary")}>
          <CardContent className="p-3">
            <p className="text-sm italic text-muted-foreground leading-relaxed">{post.excerpt}</p>
          </CardContent>
        </Card>
      )}

      {post.external_url ? (
        <Card className={CARD}>
          <CardContent className="p-4 flex flex-col items-center text-center gap-3">
            <ExternalLink className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Hosted externally</h3>
              <p className={META_TEXT}>This article is on another site.</p>
            </div>
            <Button size="sm" className="h-9 rounded-lg" onClick={() => window.open(post.external_url!, "_blank", "noopener,noreferrer")}>
              Open article <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <article
          className="prose prose-sm prose-neutral dark:prose-invert max-w-none prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, "<br/>") || "" }}
        />
      )}

      <Separator className="bg-border/40" />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleShare} className="h-9 rounded-lg gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
        <Button
          size="sm"
          className="h-9 rounded-lg gap-1.5 ml-auto"
          onClick={() => navigate("/app/agents")}
        >
          <Sparkles className="h-3.5 w-3.5" /> Talk to AI
        </Button>
      </div>
    </div>
  );
}
