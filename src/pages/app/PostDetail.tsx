import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Inbox, AlertCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard, type FeedPost } from "@/domains/feed/components/talent/PostCard";
import { CommentList } from "@/domains/feed/components/talent/CommentList";
import { PostInsightsAccordion } from "@/domains/feed/components/talent/PostInsightsAccordion";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";

// Production Type Definition based on feed_posts table schema
interface FeedPostRow {
 id: string;
 author_name: string | null;
 author_avatar: string | null;
 author_title: string | null;
 content_type: string | null;
 text_content: string | null;
 media_url: string | null;
 poll_options: any | null;
 poll_ends_at: string | null;
 link_url: string | null;
 link_preview: any | null;
 tags: string[] | null;
 is_pinned: boolean;
 created_at: string;
 author_user_id: string;
 status: string;
 is_active: boolean;
}

const mapRowToPost = (row: FeedPostRow): FeedPost => ({
 id: row.id,
 authorName: row.author_name || "Community member",
 authorAvatar: row.author_avatar || undefined,
 authorTitle: row.author_title || "",
 contentType: (row.content_type || "text") as FeedPost["contentType"],
 textContent: row.text_content || "",
 mediaUrl: row.media_url || undefined,
 pollOptions: row.poll_options,
 pollEndsAt: row.poll_ends_at,
 linkUrl: row.link_url,
 linkPreview: row.link_preview,
 tags: row.tags || undefined,
 isPinned: !!row.is_pinned,
 createdAt: row.created_at,
});

export default function PostDetail() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const { talent } = useTalent();

 // Anomaly reporting to Digital Workforce Admin Chat[cite: 5, 6]
 const reportAnomaly = async (event: string, context: any) => {
 console.error(`[Digital Workforce Anomaly] ${event}`, context);
 // Future-proofing: integration with admin-support-assistant or admin-ugc-events[cite: 5, 6]
 };

 const {
 data: post,
 isLoading,
 error,
 } = useQuery({
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

 if (error) {
 reportAnomaly("FeedFetchError", { id, error });
 throw error;
 }
 return data as FeedPostRow | null;
 },
 });

 const { data: related } = useQuery({
 queryKey: ["feed-post-related", id, post?.author_user_id, post?.tags],
 enabled: !!post,
 queryFn: async () => {
 const tags = post?.tags || [];
 let q = supabase
 .from("feed_posts")
 .select("*")
 .neq("id", id!)
 .eq("is_active", true)
 .eq("status", "published")
 .order("created_at", { ascending: false })
 .limit(3);

 if (post?.author_user_id) {
 q = q.eq("author_user_id", post.author_user_id);
 } else if (tags.length) {
 q = q.overlaps("tags", tags);
 }
 const { data, error } = await q;
 if (error) reportAnomaly("RelatedPostsError", { error });
 return (data as FeedPostRow[]) || [];
 },
 });

 useEffect(() => {
 window.scrollTo(0, 0);
 }, [id]);

 useEffect(() => {
 if (!post) return;
 const titleText = post.text_content?.slice(0, 60) || "Post";
 document.title = `${titleText} · GroUp Academy`;

 // SEO Schema Injection
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
 document.head.appendChild(ld);
 return () => ld.remove();
 }, [post]);

 return (
 <div className="min-h-screen bg-muted/10 pb-32">
 <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border/40">
 <div className="max-w-2xl mx-auto px-3 py-2 flex items-center gap-2">
 <Button
 variant="ghost"
 size="icon"
 className="h-9 w-9 rounded-full"
 onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/app/feed"))}
 >
 <ArrowLeft className="h-5 w-5" />
 </Button>
 <h1 className="text-sm font-semibold truncate">Post Analysis</h1>
 </div>
 </div>

 <div className="max-w-2xl mx-auto px-3 py-6 space-y-6">
 {isLoading && (
 <div className="space-y-4">
 <Skeleton className="h-10 w-2/3" />
 <Skeleton className="h-64 w-full rounded-2xl" />
 </div>
 )}

 {!isLoading && (!post || error) && (
 <Card className="rounded-2xl border border-dashed border-border/40 py-14 text-center">
 <CardContent className="flex flex-col items-center space-y-4">
 <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
 <p className="text-sm text-muted-foreground">This node is unreachable.</p>
 <Button asChild size="sm" variant="outline">
 <Link to="/app/feed">Return to Feed</Link>
 </Button>
 </CardContent>
 </Card>
 )}

 {post && <PostCard post={mapRowToPost(post)} />}

 {post && talent?.id && post.author_user_id === talent.userId && (
 <PostInsightsAccordion postId={post.id} isAuthor />
 )}

 {post && (
 <Card className="rounded-2xl border border-border/40 shadow-none">
 <CardContent className="p-4">
 <CommentList postId={post.id} />
 </CardContent>
 </Card>
 )}

 {related && related.length > 0 && (
 <div className="space-y-3 pt-6">
 <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">Connected Logic</h2>
 {related.map((r) => (
 <Link key={r.id} to={`/app/feed/post/${r.id}`} className="block hover:opacity-80 transition-opacity">
 <PostCard post={mapRowToPost(r)} />
 </Link>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
