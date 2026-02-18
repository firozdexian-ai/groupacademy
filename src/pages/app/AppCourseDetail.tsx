import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { getCourseCredits } from "@/lib/creditPricing";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Users,
  MapPin,
  Clock,
  Play,
  RefreshCw,
  AlertCircle,
  Coins,
  Loader2,
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

const CONTENT_TYPE_CONFIG: Record<ContentType, { icon: any; label: string; color: string }> = {
  free_video: { icon: Play, label: "Free Video", color: "bg-green-100 text-green-800" },
  recorded_course: { icon: BookOpen, label: "Recorded Course", color: "bg-blue-100 text-blue-800" },
  live_webinar: { icon: Calendar, label: "Live Webinar", color: "bg-purple-100 text-purple-800" },
  batch_class: { icon: Users, label: "Batch Class", color: "bg-orange-100 text-orange-800" },
  offline_seminar: { icon: MapPin, label: "Offline Seminar", color: "bg-red-100 text-red-800" },
};

export default function AppCourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { talent } = useTalent();
  const { balance, deductCustomAmount, refreshBalance } = useCredits();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);

  // Ref to prevent double-submission race conditions
  const isProcessing = useRef(false);

  useEffect(() => {
    if (slug) {
      fetchCourse();
    }
  }, [slug, talent?.id]);

  const trackSource = async (contentId: string) => {
    const source = searchParams.get("source");
    if (source && contentId) {
      try {
        await supabase.rpc("track_content_click", {
          p_content_id: contentId,
          p_source: source,
        });

        // Clean URL
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("source");
        window.history.replaceState({}, "", `${window.location.pathname}?${newParams.toString()}`);
      } catch (err) {
        console.error("Failed to track content click", err);
      }
    }
  };

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

      // Track click if source param exists
      trackSource(data.id);

      // Check enrollment
      if (talent?.id) {
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
      setLoadingError("Failed to load course details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollClick = () => {
    if (!talent) {
      toast.error("Please log in to enroll");
      navigate("/auth");
      return;
    }

    if (course && course.price === 0) {
      handleEnroll();
    } else {
      setShowCreditGate(true);
    }
  };

  const handleEnroll = async () => {
    if (!talent || !course || isProcessing.current) return;

    isProcessing.current = true;
    setIsEnrolling(true);
    setShowCreditGate(false);

    try {
      // 1. Process Payment (Credits)
      if (course.price > 0) {
        const creditCost = getCourseCredits(course.price);
        const success = await deductCustomAmount(
          creditCost,
          "COURSE_ENROLLMENT",
          course.id,
          `Enrolled in: ${course.title}`,
        );

        if (!success) {
          isProcessing.current = false;
          setIsEnrolling(false);
          return; // Stop if payment failed
        }
      }

      // 2. Ensure Student Profile Exists
      let studentId = talent.userId; // Default mapping strategy

      // Check if explicit student record exists
      const { data: existingStudent } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", talent.userId)
        .maybeSingle();

      if (!existingStudent) {
        const { data: newStudent, error: createError } = await supabase
          .from("students")
          .insert([
            {
              student_id: talent.userId, // Legacy mapping
              user_id: talent.userId,
              full_name: talent.fullName,
              email: talent.email,
              phone: talent.phone,
              status: "free_learner",
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }

      // 3. Create Enrollment Record
      const { error: enrollError } = await supabase.from("enrollments").insert({
        student_id: studentId,
        content_id: course.id,
        talent_id: talent.id,
        status: "active",
        enrolled_at: new Date().toISOString(),
      });

      if (enrollError) {
        if (enrollError.code === "23505") {
          // Unique violation
          toast.info("You are already enrolled!");
          setIsEnrolled(true);
        } else {
          throw enrollError;
        }
      } else {
        toast.success("Successfully enrolled!");
        setIsEnrolled(true);
        refreshBalance();
      }
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast.error("Failed to process enrollment.");
    } finally {
      setIsEnrolling(false);
      isProcessing.current = false;
    }
  };

  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const creditCost = course ? getCourseCredits(course.price) : 0;

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
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Course Unavailable</h2>
            <p className="text-muted-foreground mb-4">{loadingError || "Content not found"}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchCourse} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
              <Button onClick={() => navigate("/app/learning/courses")}>Browse Courses</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = CONTENT_TYPE_CONFIG[course.content_type] || CONTENT_TYPE_CONFIG.recorded_course;
  const embedUrl = getYouTubeEmbedUrl(course.youtube_url);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28 md:pb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/app/learning/courses")}
        className="mb-4 -ml-2 hover:bg-muted"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
      </Button>

      {/* Media Player / Cover */}
      <div className="mb-6 rounded-xl overflow-hidden bg-black shadow-lg">
        <AspectRatio ratio={16 / 9}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={course.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <img
              src={course.cover_image_url || "/placeholder-course.jpg"}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          )}
        </AspectRatio>
      </div>

      {/* Header Info */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="secondary" className={config.color}>
            <config.icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
          {course.price === 0 ? (
            <Badge className="bg-green-600 hover:bg-green-700">Free</Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50">
              <Coins className="h-3 w-3 mr-1" />
              {creditCost} Credits
            </Badge>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">{course.title}</h1>

        {course.instructor_name && (
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {course.instructor_name.charAt(0)}
            </span>
            Instructor: <span className="font-medium text-foreground">{course.instructor_name}</span>
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {course.duration_hours && (
          <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-background rounded-full shadow-sm text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-semibold text-sm">{course.duration_hours}h</p>
            </div>
          </div>
        )}
        {course.modules_count && (
          <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-background rounded-full shadow-sm text-secondary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Modules</p>
              <p className="font-semibold text-sm">{course.modules_count}</p>
            </div>
          </div>
        )}
        {course.event_date && (
          <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
            <div className="p-2 bg-background rounded-full shadow-sm text-accent">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="font-semibold text-sm">{new Date(course.event_date).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* Primary Action */}
      <div className="mb-8">
        {isEnrolled ? (
          <Button
            size="lg"
            className="w-full md:w-auto md:min-w-[200px] h-12 text-base shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate(`/app/learn/${course.slug}`)}
          >
            <Play className="h-5 w-5 mr-2 fill-current" />
            Start Learning
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full md:w-auto md:min-w-[200px] h-12 text-base shadow-lg hover:shadow-xl transition-all"
            onClick={handleEnrollClick}
            disabled={isEnrolling}
          >
            {isEnrolling ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Enroll Now
                {course.price > 0 && <span className="ml-1 opacity-90 text-sm">({creditCost} credits)</span>}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Description Content */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg">Course Overview</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {course.description}
          </div>
        </CardContent>
      </Card>

      {/* Sticky Bottom CTA - Mobile */}
      <div className="fixed bottom-16 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-3 flex gap-3 md:hidden z-40">
        {isEnrolled ? (
          <Button
            className="flex-1 h-12 text-base"
            onClick={() => navigate(`/app/learn/${course.slug}`)}
          >
            <Play className="h-5 w-5 mr-2 fill-current" />
            Start Learning
          </Button>
        ) : (
          <Button
            className="flex-1 h-12 text-base"
            onClick={handleEnrollClick}
            disabled={isEnrolling}
          >
            {isEnrolling ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Enroll Now
                {course.price > 0 && <span className="ml-1 opacity-90 text-sm">({creditCost} credits)</span>}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Modals */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        serviceName={course.title}
        cost={creditCost}
        currentBalance={balance}
        onConfirm={handleEnroll}
        onBuyCredits={() => {
          setShowCreditGate(false);
          setShowPurchaseSheet(true);
        }}
        isLoading={isEnrolling}
      />

      <CreditPurchaseSheet
        isOpen={showPurchaseSheet}
        onClose={() => setShowPurchaseSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
