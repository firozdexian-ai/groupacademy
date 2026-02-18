import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Video, BookOpen, Calendar, Users, MapPin, ArrowRight, ArrowLeft, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCourseCredits } from "@/lib/creditPricing";

type ContentType = "free_video" | "recorded_course" | "live_webinar" | "batch_class" | "offline_seminar";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  content_type: ContentType;
  price: number;
  instructor_name: string;
  cover_image_url: string | null;
}

const contentTypeConfig = {
  free_video: { icon: Video, label: "Video" },
  recorded_course: { icon: BookOpen, label: "Course" },
  live_webinar: { icon: Calendar, label: "Webinar" },
  batch_class: { icon: Users, label: "Class" },
  offline_seminar: { icon: MapPin, label: "Seminar" },
};

export default function AppCourses() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ContentType | "all">("all");

  const { data: courses = [], isLoading, error, refetch } = useQuery({
    queryKey: ["app-courses"],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, description, content_type, price, instructor_name, cover_image_url")
        .eq("is_published", true)
        .eq("is_private", false)
        .order("display_order")
        .abortSignal(signal);

      if (error) throw error;
      return data as Course[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredCourses =
    selectedType === "all"
      ? courses.filter((course) => course.content_type !== "free_video")
      : courses.filter((course) => course.content_type === selectedType);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate("/app/learning")}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      <div className="mb-6">
        <h1 className="text-xl font-bold">Courses</h1>
        <p className="text-muted-foreground">Self-paced courses and workshops</p>
      </div>

      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)} className="mb-6">
        <TabsList className="w-full justify-start overflow-x-auto h-9">
          <TabsTrigger value="all" className="text-xs h-8">All</TabsTrigger>
          <TabsTrigger value="free_video" className="text-xs h-8">Videos</TabsTrigger>
          <TabsTrigger value="recorded_course" className="text-xs h-8">Courses</TabsTrigger>
          <TabsTrigger value="live_webinar" className="text-xs h-8">Webinars</TabsTrigger>
          <TabsTrigger value="batch_class" className="text-xs h-8">Classes</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Failed to load courses</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No courses match this filter
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCourses.map((course) => {
            const config = contentTypeConfig[course.content_type];
            const Icon = config.icon;

            return (
              <Card
                key={course.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all overflow-hidden"
                onClick={() => navigate(`/app/learning/courses/${course.slug}`)}
              >
                {course.cover_image_url ? (
                  <div className="h-32 overflow-hidden">
                    <img 
                      src={course.cover_image_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="h-20 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-primary/50" />
                  </div>
                )}
                
                <CardHeader className="pb-1.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">{config.label}</Badge>
                    {course.price === 0 ? (
                      <Badge variant="default" className="bg-green-500 text-xs">Free</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {getCourseCredits(course.price)} credits
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base line-clamp-1">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">{course.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between">
                    {course.instructor_name && (
                      <span className="text-xs text-muted-foreground truncate">{course.instructor_name}</span>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1 text-xs ml-auto">
                      View <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
