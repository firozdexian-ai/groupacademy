import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPublishedBlogPosts } from "@/domains/marketing/repo/marketingRepo";
import { format } from "date-fns";
import {
  FileText,
  Clock,
  Search,
  Calendar,
  ArrowRight,
  Sparkles,
  BookOpen,
  TrendingUp,
  Hash,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicLayout } from "@/layouts/PublicLayout";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", "Career Tips", "Industry Insights", "Skills Development", "Job Search", "Interview Prep"];

export default function PublicBlog() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    document.title = "Intelligence Lab - GroUp Academy | Career Insights";
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["public-blog-posts", selectedCategory, searchTerm],
    queryFn: () => listPublishedBlogPosts({ category: selectedCategory, search: searchTerm }),
  });

  const featuredPost = posts.find((p) => p.is_featured);
  const regularPosts = posts.filter((p) => !p.is_featured);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "GroUp Academy Career Lab",
    publisher: { "@type": "Organization", name: "GroUp Academy" },
    blogPost: posts.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      datePublished: p.published_at,
      image: p.featured_image,
      url: `https://groupacademy.lovable.app/blog/${p.slug}`,
    })),
  };

  return (
    <PublicLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Protocol */}
      <section className="relative pt-16 pb-24 overflow-hidden border-b border-border/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.05)_0%,transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-6 text-center space-y-6 relative z-10">
          <Badge
            variant="outline"
            className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-tight animate-in slide-in-from-top-4 duration-700"
          >
            <Sparkles className="w-3 h-3 mr-2 fill-primary" /> Intelligence Lab
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] max-w-4xl mx-auto">
            Decipher the <span className="text-primary">Modern</span> Career.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            Strategic insights, technical deep-dives, and career architecture from the GroUp engineering team.
          </p>
        </div>
      </section>

      <main className="container mx-auto px-6 py-12 flex-1">
        {/* Intelligence Filters */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              aria-label="Search blog articles"
              placeholder="Search logic, roles, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 rounded-2xl border-border/40 bg-muted/20 focus-visible:ring-primary/20"
            />

          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                className={cn(
                  "shrink-0 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-6 transition-all",
                  selectedCategory === cat ? "shadow-lg shadow-primary/20" : "border-border/40 hover:bg-muted",
                )}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "All" ? <TrendingUp className="w-3 h-3 mr-2" /> : <Hash className="w-3 h-3 mr-2 opacity-40" />}
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-12">
            <Skeleton className="h-[450px] w-full rounded-2xl" />
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-16">
            {/* Featured Narrative */}
            {featuredPost && (
              <Card
                className="rounded-2xl border-border/40 bg-card overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-700"
                onClick={() => navigate(`/blog/${featuredPost.slug}`)}
              >
                <div className="lg:flex min-h-[450px]">
                  {featuredPost.featured_image && (
                    <div className="lg:w-3/5 relative overflow-hidden">
                      <img
                        src={featuredPost.featured_image}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "p-8 md:p-12 flex flex-col justify-center space-y-6",
                      featuredPost.featured_image ? "lg:w-2/5" : "w-full",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className="bg-primary text-white border-none rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest">
                        Featured
                      </Badge>
                      {featuredPost.category && (
                        <Badge
                          variant="outline"
                          className="rounded-full px-4 py-1 text-[9px] font-black uppercase tracking-widest border-border/60"
                        >
                          {featuredPost.category}
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter leading-[1.1] group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-muted-foreground text-lg font-medium leading-relaxed line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-tight text-muted-foreground pt-4">
                      {featuredPost.published_at && (
                        <span className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(featuredPost.published_at), "MMM d, yyyy")}
                        </span>
                      )}
                      {featuredPost.reading_time_mins && (
                        <span className="flex items-center gap-2 text-primary">
                          <Clock className="h-3.5 w-3.5" />
                          {featuredPost.reading_time_mins} MIN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Standard Distribution Grid */}
            {regularPosts.length > 0 && (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {regularPosts.map((post) => (
                  <Card
                    key={post.id}
                    className="rounded-2xl border-border/40 bg-card overflow-hidden group cursor-pointer hover:shadow-xl hover:border-primary/20 transition-all duration-500 flex flex-col"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                  >
                    {post.featured_image && (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    )}
                    <CardContent className="p-8 flex flex-col flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        {post.category && (
                          <Badge
                            variant="secondary"
                            className="bg-muted/50 text-[9px] font-black uppercase tracking-widest rounded-full px-3"
                          >
                            {post.category}
                          </Badge>
                        )}
                        <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all" />
                      </div>
                      <h3 className="text-xl font-black tracking-tight leading-tight line-clamp-2 flex-1 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground pt-4 border-t border-border/40">
                        <div className="flex items-center gap-3">
                          {post.published_at && <span>{format(new Date(post.published_at), "dd.MM.yy")}</span>}
                          <span className="h-1 w-1 rounded-full bg-border" />
                          {post.reading_time_mins && <span>{post.reading_time_mins} MIN</span>}
                        </div>
                        <BookOpen className="h-3 w-3 opacity-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Card className="rounded-2xl border-border/40 bg-muted/20 py-24 border-dashed">
            <CardContent className="text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-background flex items-center justify-center mx-auto shadow-xl">
                <FileText className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter uppercase">No Intelligence Found</h3>
              <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
                {searchTerm || selectedCategory !== "All"
                  ? "Adjust search filters to locate article."
                  : "Laboratory data sync pending."}
              </p>
              {(searchTerm || selectedCategory !== "All") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All");
                  }}
                  className="font-black uppercase text-[10px] tracking-widest text-primary"
                >
                  Clear Sequence
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </PublicLayout>
  );
}
