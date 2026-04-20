import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { format } from "date-fns";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  FileText,
  Clock,
  ArrowLeft,
  User,
  Calendar,
  Tag,
  Share2,
  Eye,
  ExternalLink,
  Sun,
  Moon,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import logoIcon from "@/assets/logo-icon.png";
import { cn } from "@/lib/utils";

export default function PublicBlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const { data: post, isLoading } = useQuery({
    queryKey: ["public-blog-post", slug],
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

  const viewMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await supabase.from("blog_posts").select("views").eq("id", postId).single();
      await supabase.from("blog_posts").update({ views: (data?.views || 0) + 1 }).eq("id", postId);
    },
  });

  useEffect(() => {
    if (post?.id) viewMutation.mutate(post.id);
  }, [post?.id]);

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} | GroUp Intelligence Lab`;

    // SEO Meta Engine
    const url = `https://groupacademy.lovable.app/blog/${post.slug}`;
    const description = post.excerpt || post.title;

    const metaTags = [
      { property: "og:title", content: post.title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: post.featured_image || "" },
      { name: "description", content: description },
      { name: "twitter:card", content: "summary_large_image" },
    ];

    metaTags.forEach((tag) => {
      const key = "property" in tag ? "property" : "name";
      let el = document.querySelector(`meta[${key}="${tag[key]}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(key, tag[key] as string);
        document.head.appendChild(el);
      }
      el.setAttribute("content", tag.content || "");
    });
  }, [post]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post?.title, text: post?.excerpt || "", url: shareUrl });
      } else {
        throw new Error();
      }
    } catch {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Intelligence link synchronized to clipboard.");
    }
  };

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        datePublished: post.published_at,
        image: post.featured_image,
        author: { "@type": "Person", name: post.author_name || "GroUp Editorial" },
        publisher: { "@type": "Organization", name: "GroUp Academy" },
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/10">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <img
            src={theme === "dark" ? logoLight : logoDark}
            alt="GroUp"
            className="h-8 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl"
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/auth")}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest px-6"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-6 py-12 animate-in fade-in duration-700">
        {isLoading ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-[32px]" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : !post ? (
          <div className="text-center py-24 space-y-6">
            <div className="h-20 w-20 rounded-[32px] bg-muted flex items-center justify-center mx-auto">
              <FileText className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase">Artifact Missing</h2>
            <Button
              onClick={() => navigate("/blog")}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to Lab
            </Button>
          </div>
        ) : (
          <article className="max-w-3xl mx-auto">
            <header className="space-y-8 mb-12">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/blog")}
                className="rounded-full font-bold uppercase text-[9px] tracking-widest hover:bg-primary/5 pl-0"
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to Intelligence Lab
              </Button>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-primary/10 text-primary border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest">
                    {post.category || "Insight"}
                  </Badge>
                  {post.tags?.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-full border-border/60 text-[9px] font-bold uppercase px-3 py-1 bg-muted/20"
                    >
                      <Tag className="h-2.5 w-2.5 mr-1.5 opacity-40" /> {tag}
                    </Badge>
                  ))}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.95] text-foreground">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-3 w-3 text-primary" />
                    </div>
                    <span>{post.author_name || "GroUp Editorial"}</span>
                  </div>
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(post.published_at), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-2 text-primary/60">
                    <Clock className="h-3.5 w-3.5" />
                    {post.reading_time_mins || 5} MIN READ
                  </span>
                  <span className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" />
                    {post.views || 0} VIEWS
                  </span>
                </div>
              </div>
            </header>

            {post.featured_image && (
              <div className="rounded-[40px] overflow-hidden mb-12 shadow-2xl border border-border/40 bg-muted">
                <img src={post.featured_image} alt={post.title} className="w-full h-auto object-cover max-h-[500px]" />
              </div>
            )}

            {post.excerpt && (
              <div className="mb-12 p-8 rounded-[32px] bg-primary/[0.03] border-l-4 border-primary">
                <p className="text-xl md:text-2xl font-medium text-foreground/80 leading-relaxed italic">
                  "{post.excerpt}"
                </p>
              </div>
            )}

            <div className="prose prose-neutral dark:prose-invert max-w-none mb-16 prose-p:leading-[1.8] prose-p:text-lg prose-headings:font-black prose-headings:tracking-tighter prose-img:rounded-[32px]">
              {post.external_url ? (
                <Card className="rounded-[40px] border-primary/20 bg-card overflow-hidden shadow-xl border-dashed border-2">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-6">
                    <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                      <ExternalLink className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black tracking-tighter uppercase">Extended Intelligence</h3>
                      <p className="text-muted-foreground font-medium max-w-md">
                        This artifact is hosted within our partner ecosystem for specialized deep-dives.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                      onClick={() => window.open(post.external_url!, "_blank", "noopener,noreferrer")}
                    >
                      Access Full Article <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, "<br/>") || "" }}
                  className="article-body"
                />
              )}
            </div>

            <footer className="space-y-12 pb-24">
              <Separator className="bg-border/40" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <Button
                  variant="outline"
                  className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-border/40"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" /> Broadcast Logic
                </Button>
                <div className="flex items-center gap-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">More Content</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/blog")}
                    className="h-12 w-12 rounded-xl bg-primary/5 text-primary"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <Card className="rounded-[40px] border-primary/20 bg-gradient-to-br from-primary/10 to-transparent shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Sparkles className="h-32 w-32 text-primary" />
                </div>
                <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black tracking-tighter uppercase">Upgrade Your Logic.</h3>
                    <p className="text-sm font-medium text-muted-foreground max-w-md">
                      Join 50k+ professionals using our AI career agents and verified certificate tracks.
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => navigate("/auth?tab=signup")}
                    className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
                  >
                    Join Academy <ShieldCheck className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </footer>
          </article>
        )}
      </main>

      <footer className="border-t border-border/40 bg-card py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src={logoIcon} className="h-6 w-6 grayscale opacity-40" alt="Logo" />
            <span>© 2026 GroUp Academy</span>
          </div>
          <nav className="flex gap-8">
            {["home", "courses", "blog"].map((link) => (
              <button
                key={link}
                onClick={() => navigate(link === "home" ? "/" : `/${link}`)}
                className="hover:text-primary transition-colors"
              >
                {link}
              </button>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
