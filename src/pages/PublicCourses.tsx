import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import logoIcon from "@/assets/logo-icon.png";
import {
  ArrowRight, Sun, Moon, BookOpen, Clock, Users, Sparkles, GraduationCap,
} from "lucide-react";

export default function PublicCourses() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    document.title = "Courses & Learning Tracks - GroUp Academy | Professional Development";
  }, []);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["public-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, description, cover_image_url, thumbnail_url, content_type, duration_hours, current_enrollment, instructor_name, modules_count, credit_cost")
        .eq("is_published", true)
        .eq("is_private", false)
        .in("content_type", ["course", "workshop"])
        .order("current_enrollment", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tracks = [], isLoading: tracksLoading } = useQuery({
    queryKey: ["public-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profession_categories")
        .select("id, name, slug, description")
        .eq("is_active", true)
        .order("display_order")
        .limit(8);
      if (error) throw error;
      return data || [];
    },
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "GroUp Academy Courses",
    description: "Professional development courses across 7 academies covering careers, freelancing, influencing, and more.",
    itemListElement: courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: c.title,
        description: c.description,
        provider: { "@type": "Organization", name: "GroUp Academy" },
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <img
            src={theme === "dark" ? logoLight : logoDark}
            alt="GroUp Academy"
            className="h-10 w-auto cursor-pointer"
            onClick={() => navigate("/")}
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth")}>Sign In</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-hero py-16 md:py-20 text-center">
        <div className="container mx-auto px-6">
          <Badge variant="outline" className="gap-2 px-4 py-1.5 mb-6">
            <GraduationCap className="w-3 h-3" /> 7 Academies • 300+ Courses
          </Badge>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            Learn. <span className="text-gradient">Grow.</span> Succeed.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Professional courses and structured career tracks designed by industry experts. Start learning for free with your welcome credits.
          </p>
          <Button size="lg" onClick={() => navigate("/auth?tab=signup&returnTo=/app/learning")}>
            Start Learning Free <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Career Tracks */}
      {tracks.length > 0 && (
        <section className="container mx-auto px-6 py-12 border-b">
          <h2 className="text-2xl font-heading font-bold mb-2 text-center">Career Tracks</h2>
          <p className="text-muted-foreground text-center mb-8">Structured learning paths for your profession</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {tracks.map((track) => (
              <Card
                key={track.id}
                className="cursor-pointer hover:shadow-md transition-all text-center"
                onClick={() => navigate(`/auth?tab=signup&returnTo=/app/learning/tracks/${track.slug}`)}
              >
                <CardContent className="p-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-medium text-sm">{track.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Courses Grid */}
      <section className="container mx-auto px-6 py-12 md:py-16">
        <h2 className="text-2xl font-heading font-bold mb-2 text-center">Popular Courses</h2>
        <p className="text-muted-foreground text-center mb-8">Self-paced professional development</p>

        {coursesLoading ? (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => navigate(`/courses/${course.slug}`)}
              >
                {(course.cover_image_url || course.thumbnail_url) && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={course.cover_image_url || course.thumbnail_url || ""}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardContent className="p-4">
                  <Badge variant="secondary" className="text-xs mb-2 capitalize">
                    {course.content_type}
                  </Badge>
                  <h3 className="font-semibold line-clamp-2 mb-2">{course.title}</h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {course.modules_count && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {course.modules_count} modules
                      </span>
                    )}
                    {course.duration_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {course.duration_hours}h
                      </span>
                    )}
                    {course.current_enrollment && course.current_enrollment > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {course.current_enrollment}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {courses.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => navigate("/auth?tab=signup&returnTo=/app/learning/courses")}>
              View All Courses <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-muted/50 py-12 text-center">
        <div className="container mx-auto px-6">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold mb-2">Ready to accelerate your career?</h2>
          <p className="text-muted-foreground mb-6">Sign up free and get 250 credits to start learning today.</p>
          <Button size="lg" onClick={() => navigate("/auth?tab=signup")}>
            Create Free Account <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoIcon} alt="GroUp" className="w-8 h-8" />
            <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} GroUp Academy</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Home</button>
            <button onClick={() => navigate("/career-services")} className="hover:text-foreground transition-colors">Services</button>
            <button onClick={() => navigate("/blog")} className="hover:text-foreground transition-colors">Blog</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
