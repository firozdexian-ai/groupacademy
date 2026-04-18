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
        if (!success) throw new Error("Payment failed");
      }

      // 2. Resolve Student ID (Atomic resolution)
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
              status: "active_learner",
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

      // 4. Update Talent Services Metadata
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

  if (isLoading)
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-10 w-1/2" />
      </div>
    );

  if (loadingError || !course) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Course Not Found</h2>
        <Button variant="link" onClick={() => navigate("/app/learning")}>
          Return to Academy
        </Button>
      </div>
    );
  }

  const creditCost = getCourseCredits(course.price);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-32">
      <Button variant="ghost" size="sm" onClick={onBack || (() => navigate(-1))} className="mb-6 group">
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Academy
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl border-4 border-white dark:border-muted/20">
            {course.youtube_url ? (
              <iframe
                src={`https://www.youtube.com/embed/${course.youtube_url.match(/(?:v=|be\/)([^&\s?]+)/)?.[1]}`}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <img src={course.cover_image_url || "/placeholder.jpg"} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-black tracking-tight">{course.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge className={CONTENT_TYPE_CONFIG[course.content_type].color}>
                {course.content_type.replace("_", " ")}
              </Badge>
              <Badge variant="outline" className="font-bold">
                <Users className="h-3 w-3 mr-1" />
                {course.instructor_name}
              </Badge>
            </div>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{course.description}</p>
          </div>
        </div>

        {/* Right: Pricing & Enrollment Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border-primary/20 shadow-xl overflow-hidden rounded-3xl">
            <div className="bg-primary/5 p-6 border-b border-primary/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Access Fee</span>
                {course.price === 0 ? (
                  <span className="text-emerald-600 font-black text-xl">FREE</span>
                ) : (
                  <div className="flex items-center gap-1.5 text-primary">
                    <Coins className="h-5 w-5" />
                    <span className="text-2xl font-black tracking-tighter">{creditCost}</span>
                  </div>
                )}
              </div>

              {isEnrolled ? (
                <Button
                  className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg group"
                  onClick={() => navigate(`/app/learn/${course.slug}`)}
                >
                  <Play className="mr-2 h-5 w-5 fill-current" />
                  Continue Learning
                </Button>
              ) : (
                <Button
                  className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg bg-primary hover:scale-[1.02] transition-transform"
                  onClick={() => (course.price === 0 ? handleEnroll() : setShowCreditGate(true))}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? <Loader2 className="animate-spin" /> : "Enroll Now"}
                </Button>
              )}
            </div>

            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{course.duration_hours || 0} Hours of content</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>{course.modules_count || 0} Learning modules</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Certificate of Completion</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
