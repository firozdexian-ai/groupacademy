import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
  ArrowLeft, BookOpen, Calendar, Users, MapPin, Clock, 
  Play, RefreshCw, AlertCircle, Youtube
} from "lucide-react";
import { toast } from "sonner";

type ContentType = "free_video" | "recorded_course" | "live_webinar" | "batch_class" | "offline_seminar";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  content_type: ContentType;
  price: number;
  instructor_name: string;
  youtube_url: string | null;
  cover_image_url: string | null;
  event_date: string | null;
  duration_hours: number | null;
  modules_count: number | null;
}

const contentTypeConfig = {
  free_video: { icon: Play, label: "Free Video" },
  recorded_course: { icon: BookOpen, label: "Recorded Course" },
  live_webinar: { icon: Calendar, label: "Live Webinar" },
  batch_class: { icon: Users, label: "Batch Class" },
  offline_seminar: { icon: MapPin, label: "Offline Seminar" },
};

export default function AppCourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    if (slug) fetchCourse();
  }, [slug]);

  const fetchCourse = async () => {
    setLoadingError(null);
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setLoadingError("Course not found");
        return;
      }

      setCourse(data);

      // Check enrollment if user has talent profile
      if (talent) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("talent_id", talent.id)
          .eq("content_id", data.id)
          .maybeSingle();

        setIsEnrolled(!!enrollment);
      }
    } catch (error: any) {
      console.error("Error fetching course:", error);
      setLoadingError("Failed to load course.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!talent) {
      toast.error("Please complete your profile first");
      navigate("/app/profile");
      return;
    }

    setIsEnrolling(true);
    try {
      // First check if student profile exists
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", talent.userId)
        .maybeSingle();

      if (!student) {
        // Create student profile
        const { data: newStudent, error: createError } = await supabase
          .from("students")
          .insert([{
            student_id: talent.userId,
            user_id: talent.userId,
            full_name: talent.fullName,
            email: talent.email,
            phone: talent.phone,
            status: "free_learner"
          }])
          .select()
          .single();

        if (createError) throw createError;

        const { error: enrollError } = await supabase
          .from("enrollments")
          .insert({
            student_id: newStudent.id,
            content_id: course!.id,
            talent_id: talent.id,
            status: course!.price > 0 ? "pending_payment" : "active",
          });

        if (enrollError) throw enrollError;
      } else {
        const { error: enrollError } = await supabase
          .from("enrollments")
          .insert({
            student_id: student.id,
            content_id: course!.id,
            talent_id: talent.id,
            status: course!.price > 0 ? "pending_payment" : "active",
          });

        if (enrollError) {
          if (enrollError.code === '23505') {
            toast.info("You're already enrolled in this course");
            setIsEnrolled(true);
            return;
          }
          throw enrollError;
        }
      }

      toast.success(course!.price > 0 ? "Enrolled! Complete payment to access." : "Successfully enrolled!");
      setIsEnrolled(true);
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast.error("Failed to enroll. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-10 w-3/4 mb-2" />
        <Skeleton className="aspect-video w-full rounded-lg mb-4" />
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    );
  }

  if (loadingError || !course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Failed to Load Course</h2>
            <p className="text-muted-foreground mb-4">{loadingError}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchCourse}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate("/app/learning/courses")}>
                Browse Courses
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = contentTypeConfig[course.content_type];
  const Icon = config.icon;
  const embedUrl = getYouTubeEmbedUrl(course.youtube_url);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate("/app/learning/courses")}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Cover or Video */}
      {embedUrl ? (
        <div className="mb-6 rounded-lg overflow-hidden">
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={embedUrl}
              title={course.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </AspectRatio>
        </div>
      ) : course.cover_image_url ? (
        <div className="mb-6 rounded-lg overflow-hidden">
          <AspectRatio ratio={16 / 9}>
            <img 
              src={course.cover_image_url} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          </AspectRatio>
        </div>
      ) : null}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="secondary">{config.label}</Badge>
          {course.price === 0 ? (
            <Badge className="bg-green-500">Free</Badge>
          ) : (
            <Badge variant="outline">BDT {course.price}</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        {course.instructor_name && (
          <p className="text-muted-foreground">by {course.instructor_name}</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
        {course.duration_hours && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.duration_hours} hours
          </span>
        )}
        {course.modules_count && (
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.modules_count} modules
          </span>
        )}
        {course.event_date && (
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {new Date(course.event_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* CTA */}
      {isEnrolled ? (
        <Button 
          size="lg" 
          className="w-full mb-6"
          onClick={() => navigate(`/learn/${course.slug}`)}
        >
          <Play className="h-4 w-4 mr-2" />
          Continue Learning
        </Button>
      ) : (
        <Button 
          size="lg" 
          className="w-full mb-6"
          onClick={handleEnroll}
          disabled={isEnrolling}
        >
          {isEnrolling ? "Enrolling..." : course.price === 0 ? "Enroll Free" : `Enroll - BDT ${course.price}`}
        </Button>
      )}

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About This Course</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap">{course.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
