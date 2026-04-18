import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Sparkles,
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

export default function AppCourseDetail({ inlineSlug, onBack }: { inlineSlug?: string; onBack?: () => void }) {
  const params = useParams();
  const slug = inlineSlug || params.slug;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { talent, refreshTalent } = useTalent();
  const { balance, deductCustomAmount, refreshBalance } = useCredits();

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);

  const isProcessing = useRef(false);

  useEffect(() => {
    if (slug) fetchCourse();
  }, [slug, talent?.id]);

  const fetchCourse = async () => {
    setIsLoading(true);
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

      if (talent?.id) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("talent_id", talent.id)
          .eq("content_id", data.id)
          .maybeSingle();

        setIsEnrolled(!!enrollment);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setLoadingError("Failed to load course details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!talent || !course || isProcessing.current) return;

    isProcessing.current = true;
    setIsEnrolling(true);
    setShowCreditGate(false);

    try {
      // 1. Credit Deduction
      if (course.price > 0) {
        const creditCost = getCourseCredits(course.price);
        const success = await deductCustomAmount(
          creditCost,
          "COURSE_ENROLLMENT",
          course.id,
          `Enrolled: ${course.title}`,
        );
        if (!success) throw new Error("Insufficient credits or payment failed");
      }

      // 2. Resolve Student ID
      let studentId: string;
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
              user_id: talent.userId,
              full_name: talent.fullName,
              email: talent.email,
              status: "enrolled", // Fixed enum value
            },
          ])
          .select()
          .single();
        if (createError) throw createError;
        studentId = newStudent.id;
      } else {
        studentId = existingStudent.id;
      }

      // 3. Create Enrollment
      const { error: enrollError } = await supabase.from("enrollments").insert({
        student_id: studentId,
        content_id: course.id,
        talent_id: talent.id,
        status: "active",
      });

      if (enrollError && enrollError.code !== "23505") throw enrollError;

      // 4. Update Metadata
      const updatedServices = Array.from(new Set([...(talent.servicesUsed || []), "course_enrollment"]));
      await supabase.from("talents").update({ services_used: updatedServices }).eq("id", talent.id);

      toast.success("Welcome to the course!");
      setIsEnrolled(true);
      refreshBalance();
      await refreshTalent();
    } catch (error: any) {
      console.error("Enrollment failed:", error);
      toast.error(error.message || "Failed to process enrollment.");
    } finally {
      setIsEnrolling(false);
      isProcessing.current = false;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video w-full rounded-3xl" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (loadingError || !course) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <AlertCircle className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-2xl font-black">Course Unavailable</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{loadingError}</p>
        <Button onClick={() => navigate("/app/learning")}>Return to Academy</Button>
      </div>
    );
  }

  const creditCost = getCourseCredits(course.price);
  const config = CONTENT_TYPE_CONFIG[course.content_type] || CONTENT_TYPE_CONFIG.recorded_course;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-32 transition-all animate-in fade-in duration-700">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack || (() => navigate(-1))}
        className="mb-6 group hover:bg-primary/5"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Academy
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Course Core Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="relative group rounded-[32px] overflow-hidden bg-black aspect-video shadow-2xl border-4 border-white dark:border-muted/20">
            {course.youtube_url ? (
              <iframe
                src={`https://www.youtube.com/embed/${course.youtube_url.match(/(?:v=|be\/)([^&\s?]+)/)?.[1]}`}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <img
                src={course.cover_image_url || "/placeholder-course.jpg"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={cn("px-3 py-1 font-bold uppercase tracking-widest text-[10px]", config.color)}>
                  {config.label}
                </Badge>
                <Badge variant="secondary" className="px-3 py-1 font-bold text-[10px] uppercase">
                  <Users className="h-3 w-3 mr-1.5" />
                  {course.instructor_name}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{course.title}</h1>
            </div>

            <div className="bg-muted/30 rounded-3xl p-6 md:p-8">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Strategic Overview
              </h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
                {course.description}
              </p>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 border-primary/20 shadow-2xl overflow-hidden rounded-[32px] bg-card/50 backdrop-blur-md">
            <div className="bg-primary/5 p-8 border-b border-primary/10">
              <div className="flex justify-between items-end mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Investment</p>
                  {course.price === 0 ? (
                    <p className="text-3xl font-black text-emerald-600">FREE</p>
                  ) : (
                    <div className="flex items-center gap-2 text-primary">
                      <Coins className="h-6 w-6" />
                      <p className="text-4xl font-black tracking-tighter">{creditCost}</p>
                    </div>
                  )}
                </div>
              </div>

              {isEnrolled ? (
                <Button
                  className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 group"
                  onClick={() => navigate(`/app/learn/${course.slug}`)}
                >
                  <Play className="mr-3 h-6 w-6 fill-current group-hover:scale-110 transition-transform" />
                  Start Learning
                </Button>
              ) : (
                <Button
                  className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:scale-[1.02] active:scale-95 transition-all"
                  onClick={() => (course.price === 0 ? handleEnroll() : setShowCreditGate(true))}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? <Loader2 className="animate-spin h-6 w-6" /> : "Secure Enrollment"}
                </Button>
              )}
            </div>

            <CardContent className="p-8 space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center gap-4 text-sm font-bold p-3 bg-muted/20 rounded-xl">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{course.duration_hours || 0} Hours Duration</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold p-3 bg-muted/20 rounded-xl">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>{course.modules_count || 0} Professional Modules</span>
                </div>
                {course.event_date && (
                  <div className="flex items-center gap-4 text-sm font-bold p-3 bg-muted/20 rounded-xl">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Live on {new Date(course.event_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                  Enrollment includes lifetime access and digital certification
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Persistence Modals */}
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
