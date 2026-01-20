import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, ArrowLeft, User, Calendar, Tag, Share2, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from "sonner";
import { useEffect } from "react";

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

  // Increment view count
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
      toast.success("Link copied to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <Skeleton className="h-64 w-full mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Article Not Found</h2>
        <p className="text-muted-foreground mb-4">This article may have been removed or is not yet published.</p>
        <Button onClick={() => navigate("/app/learning/blog")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning/blog")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        <div className="flex flex-wrap gap-2 mb-3">
          {post.category && <Badge variant="outline">{post.category}</Badge>}
          {post.tags &&
            post.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          {/* Show External Badge if applicable */}
          {post.external_url && (
            <Badge variant="default" className="gap-1 bg-blue-600 hover:bg-blue-700">
              <ExternalLink className="h-3 w-3" />
              External Article
            </Badge>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {post.author_name && (
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author_name}
            </span>
          )}
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(post.published_at), "MMMM d, yyyy")}
            </span>
          )}
          {post.reading_time_mins && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time_mins} min read
            </span>
          )}
          {post.views > 0 && (
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.views} views
            </span>
          )}
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="rounded-xl overflow-hidden mb-8 shadow-sm border border-border/50">
          <img src={post.featured_image} alt={post.title} className="w-full h-auto object-cover max-h-[400px]" />
        </div>
      )}

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-lg text-muted-foreground mb-6 font-medium leading-relaxed border-l-4 border-primary/20 pl-4">
          {post.excerpt}
        </p>
      )}

      <Separator className="mb-6" />

      {/* Content Handling: External vs Internal */}
      {post.external_url ? (
        <Card className="bg-muted/30 border-dashed mb-8">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <ExternalLink className="h-12 w-12 text-muted-foreground opacity-50" />
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Read the full article</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This article is hosted on an external site. Click below to read the full content.
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => window.open(post.external_url, "_blank", "noopener,noreferrer")}
            >
              Read on External Site
              <ExternalLink className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <article className="prose prose-neutral dark:prose-invert max-w-none mb-8">
          {post.content ? (
            <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }} />
          ) : (
            <div className="p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
              No content details available.
            </div>
          )}
        </article>
      )}

      <Separator className="mb-6" />

      {/* Share & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning/blog")}>
          More Articles
          <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
        </Button>
      </div>

      {/* Related Articles Placeholder */}
      <Card className="mt-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold mb-2">Want personalized career insights?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Our AI career agents can help you apply these learnings to your specific profile.
          </p>
          <Button onClick={() => navigate("/app/agents")}>Talk to AI Career Coach</Button>
        </CardContent>
      </Card>
    </div>
  );
}
