import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Video, BookOpen, Calendar, Users, MapPin, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { BannerCarousel } from "@/components/BannerCarousel";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

type ContentType = "free_video" | "recorded_course" | "live_webinar" | "batch_class" | "offline_seminar";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  content_type: ContentType;
  price: number;
  instructor_name: string;
  event_date: string | null;
  max_capacity: number | null;
  current_enrollment: number;
  cover_image_url: string | null;
}

const contentTypeConfig = {
  free_video: { icon: Video, label: "Free Videos", color: "from-blue-500 to-cyan-500" },
  recorded_course: { icon: BookOpen, label: "Courses", color: "from-purple-500 to-pink-500" },
  live_webinar: { icon: Calendar, label: "Webinars", color: "from-teal-500 to-green-500" },
  batch_class: { icon: Users, label: "Batch Classes", color: "from-emerald-500 to-teal-600" },
  offline_seminar: { icon: MapPin, label: "Seminars", color: "from-orange-500 to-red-500" },
};

const Courses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ContentType | "all">("all");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("is_published", true)
        .eq("is_private", false)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast.error("Failed to load courses");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses =
    selectedType === "all"
      ? courses.filter((course) => course.content_type !== "free_video") // Exclude free videos from All tab
      : courses.filter((course) => course.content_type === selectedType);

  const getCapacityStatus = (course: Course) => {
    if (!course.max_capacity) return null;
    const remaining = course.max_capacity - course.current_enrollment;
    const percentage = (course.current_enrollment / course.max_capacity) * 100;
    
    if (remaining <= 0) return { text: "Full", variant: "destructive" as const };
    if (percentage >= 80) return { text: `${remaining} spots left`, variant: "outline" as const };
    return { text: `${remaining} spots available`, variant: "secondary" as const };
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Banner Carousel */}
        <BannerCarousel />

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Explore Our Courses</h2>
            <p className="text-lg text-muted-foreground">
              Find the perfect learning experience for your goals
            </p>
          </div>

          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)} className="mb-8">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="free_video">Videos</TabsTrigger>
              <TabsTrigger value="recorded_course">Courses</TabsTrigger>
              <TabsTrigger value="live_webinar">Webinars</TabsTrigger>
              <TabsTrigger value="batch_class">Classes</TabsTrigger>
              <TabsTrigger value="offline_seminar">Seminars</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="w-14 h-14 bg-muted rounded-2xl mb-4"></div>
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground">No courses available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const config = contentTypeConfig[course.content_type];
                const Icon = config.icon;
                const capacityStatus = getCapacityStatus(course);

                return (
                  <Card
                    key={course.id}
                    className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/courses/${course.slug}`)}
                  >
                    {course.cover_image_url ? (
                      <div className="aspect-video w-full overflow-hidden relative">
                        <img 
                          src={course.cover_image_url} 
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className={`w-full h-32 bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                        <Icon className="w-12 h-12 text-white/90" />
                      </div>
                    )}
                    
                    <CardHeader>
                      
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {!course.cover_image_url && (
                          <Badge variant="secondary">{config.label}</Badge>
                        )}
                        {course.price === 0 ? (
                          <Badge variant="default" className="bg-green-500">Free</Badge>
                        ) : (
                          <Badge variant="outline">BDT {course.price}</Badge>
                        )}
                        {capacityStatus && (
                          <Badge variant={capacityStatus.variant}>{capacityStatus.text}</Badge>
                        )}
                      </div>

                      <CardDescription className="line-clamp-3 min-h-[60px]">
                        {course.description || "No description available"}
                      </CardDescription>

                      <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                        {course.instructor_name && (
                          <p className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {course.instructor_name}
                          </p>
                        )}
                        {course.event_date && (
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(course.event_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <Button className="w-full group-hover:bg-primary/90" disabled={capacityStatus?.variant === "destructive"}>
                        {capacityStatus?.variant === "destructive" ? "Full" : "View Details"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Courses;
