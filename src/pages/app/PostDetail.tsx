import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Inbox } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard, type FeedPost } from "@/components/feed/PostCard";
import { CommentList } from "@/components/feed/CommentList";

function mapRowToPost(row: any): FeedPost {
  return {
    id: row.id,
    authorName: row.author_name || "Community member",
    authorAvatar: row.author_avatar || undefined,
    authorTitle: row.author_title || "",
    contentType: row.content_type || "text",
    textContent: row.text_content || "",
    mediaUrl: row.media_url || undefined,
    pollOptions: row.poll_options || undefined,
    pollEndsAt: row.poll_ends_at || undefined,
    linkUrl: row.link_url || undefined,
    linkPreview: row.link_preview || undefined,
    tags: row.tags || undefined,
    isPinned: !!row.is_pinned,
    createdAt: row.created_at,
  };
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["feed-post", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("*")
        .eq("id", id!)
        .eq("is_active", true)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["feed-post-related", id, post?.author_user_id, post?.tags],
    enabled: !!post,
    queryFn: async () => {
      const tags: string[] = (post as any)?.tags || [];
      let q = supabase
        .from("feed_posts")
        .select("*")
        .neq("id", id!)
        .eq("is_active", true)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);
      if ((post as any)?.author_user_id) {
        q = q.eq("author_user_id", (post as any).author_user_id);
      } else if (tags.length) {
        q = q.overlaps("tags", tags);
      }
      const { data } = await q;
      return data || [];
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const titleText = post?.text_content?.slice(0, 60) || "Post";
  const descText = post?.text_content?.slice(0, 160) || "Community post on GroUp Academy";

  useEffect(() => {
    if (!post) return;
    const prevTitle = document.title;
    document.title = `${titleText} · GroUp Academy`;
    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content") ?? null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", descText);

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SocialMediaPosting",
      headline: titleText,
      articleBody: post.text_content || "",
      datePublished: post.created_at,
      author: { "@type": "Person", name: post.author_name || "Community member" },
    });
    ld.dataset.postLd = post.id;
    document.head.appendChild(ld);

    return () => {
      document.title = prevTitle;
      if (prevDesc !== null) metaDesc?.setAttribute("content", prevDesc);
      ld.remove();
    };
  }, [post, titleText, descText]);

  return (
    <div className="min-h-screen bg-muted/10 pb-32">

      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/40">
        <div className="max-w-2xl mx-auto px-3 py-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/app/feed"))}
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-sm font-semibold truncate">Post</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-3 space-y-4">
        {isLoading && (
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-8 w-1/3" />
            </CardContent>
          </Card>
        )}

        {!isLoading && (!post || error) && (
          <Card className="rounded-3xl border border-dashed border-border/40 py-14 text-center">
            <CardContent className="flex flex-col items-center space-y-4">
              <Inbox className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">This post isn't available.</p>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/feed">Back to feed</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {post && <PostCard post={mapRowToPost(post)} />}

        {post && (
          <Card className="rounded-2xl border border-border/40">
            <CardContent className="p-3">
              <CommentList postId={post.id} />
            </CardContent>
          </Card>
        )}

        {related && related.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
              More like this
            </h2>
            {related.map((r: any) => (
              <Link key={r.id} to={`/app/feed/post/${r.id}`} className="block">
                <PostCard post={mapRowToPost(r)} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
