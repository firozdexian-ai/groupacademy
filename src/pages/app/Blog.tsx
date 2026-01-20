import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Clock, ArrowLeft, Search, User, Calendar, ArrowRight, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const CATEGORIES = ["All", "Career Tips", "Industry Insights", "Skills Development", "Job Search", "Interview Prep"];

export default function Blog() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts", selectedCategory, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false });

      if (selectedCategory !== "All") {
        query = query.eq("category", selectedCategory);
      }
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,excerpt.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const featuredPost = posts?.find((p) => p.is_featured);
  const regularPosts = posts?.filter((p) => !p.is_featured) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/learning")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Career Blog</h1>
          <p className="text-muted-foreground">Articles, tutorials, and career tips</p>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-8">
          {/* Featured Post */}
          {featuredPost && (
            <Card
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/app/learning/blog/${featuredPost.slug}`)}
            >
              <div className="md:flex">
                {featuredPost.featured_image && (
                  <div className="md:w-2/5 h-48 md:h-auto">
                    <img
                      src={featuredPost.featured_image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className={`p-6 ${featuredPost.featured_image ? "md:w-3/5" : "w-full"}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-primary/10 text-primary">Featured</Badge>
                    {featuredPost.category && <Badge variant="outline">{featuredPost.category}</Badge>}
                  </div>
                  <h2 className="text-xl font-bold mb-2">{featuredPost.title}</h2>
                  {featuredPost.excerpt && (
                    <p className="text-muted-foreground mb-4 line-clamp-2">{featuredPost.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {featuredPost.author_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {featuredPost.author_name}
                      </span>
                    )}
                    {featuredPost.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(featuredPost.published_at), "MMM d, yyyy")}
                      </span>
                    )}
                    {featuredPost.reading_time_mins && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {featuredPost.reading_time_mins} min read
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Regular Posts Grid */}
          {regularPosts.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularPosts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/app/learning/blog/${post.slug}`)}
                >
                  {post.featured_image && (
                    <div className="h-40 overflow-hidden">
                      <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className={post.featured_image ? "pt-4" : "pt-6"}>
                    {post.category && (
                      <Badge variant="outline" className="mb-2">
                        {post.category}
                      </Badge>
                    )}
                    <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
                    {post.excerpt && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {post.published_at && <span>{format(new Date(post.published_at), "MMM d")}</span>}
                        {post.reading_time_mins && <span>• {post.reading_time_mins} min</span>}
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Articles Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== "All"
                ? "Try adjusting your filters to find more articles."
                : "Blog posts will be published soon. Check back later!"}
            </p>
            {(searchTerm || selectedCategory !== "All") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
