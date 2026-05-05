import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createStudentProfile } from "@/hooks/useAuth";
import { registrationSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseShareButtons } from "@/components/CourseShareButtons";
import { AccessCodeDialog } from "@/components/AccessCodeDialog";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Video,
  BookOpen,
  Calendar,
  Users,
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Key,
  Youtube,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

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
  event_duration_minutes: number | null;
  max_capacity: number | null;
  current_enrollment: number;
  venue_name: string | null;
  venue_address: string | null;
  duration_hours: number | null;
  modules_count: number | null;
  whatsapp_group_link: string | null;
}

const contentTypeConfig = {
  free_video: { icon: Video, label: "Workshop", color: "from-blue-500 to-cyan-500" },
  recorded_course: { icon: BookOpen, label: "Masterclass", color: "from-purple-500 to-pink-500" },
  live_webinar: { icon: Calendar, label: "Live Event", color: "from-teal-500 to-green-500" },
  batch_class: { icon: Users, label: "Cohort", color: "from-emerald-500 to-teal-600" },
  offline_seminar: { icon: MapPin, label: "On-Site", color: "from-orange-500 to-red-500" },
};

const CourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showAccessCodeDialog, setShowAccessCodeDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [registrationData, setRegistrationData] = useState({ fullName: "", email: "", phone: "", password: "" });

  const currentUrl = window.location.origin + window.location.pathname;

  useEffect(() => {
    checkAuth();
    fetchCourse();
  }, [slug]);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();
        setStudentProfile(student);
      }
    } catch (e) {
      console.error("Auth sync failed");
    }
  };

  const fetchCourse = async () => {
    setLoadingError(null);
    try {
      const query = supabase.from("content").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      const { data, error } = await withTimeout<any>(
        Promise.resolve(query),
        TIMEOUTS.DEFAULT,
        "Network timeout: Course unreachable",
      );

      if (error || !data) throw new Error("Course not found");
      setCourse(data);

      const source = searchParams.get("source");
      const ref = searchParams.get("ref");
      if (source) await supabase.rpc("track_content_click", { p_content_id: data.id, p_source: source });
      if (ref) {
        localStorage.setItem("course_ref", ref);
        try { await (supabase.rpc as any)("track_course_referral_click", { p_content_id: data.id, p_ref_code: ref }); } catch {}
      }

      if (user) {
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", studentProfile?.id)
          .eq("content_id", data.id)
          .maybeSingle();
        setIsEnrolled(!!enrollment);
      }
    } catch (err: any) {
      setLoadingError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickEnroll = async () => {
    if (!studentProfile) return navigate("/app/profile");
    setIsEnrolling(true);
    try {
      const { error } = await supabase.from("enrollments").insert([
        {
          student_id: studentProfile.id,
          content_id: course?.id,
          status: course?.price && course.price > 0 ? "pending_payment" : "active",
          payment_amount: course?.price || 0,
        },
      ]);
      if (error) throw error;
      toast.success("Enrollment Synchronized");
      setIsEnrolled(true);
      navigate("/my-learning");
    } catch (err: any) {
      toast.error("Enrollment failed");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleSignupAndEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEnrolling(true);
    try {
      const { data: auth, error: signError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
      });
      if (signError) throw signError;
      if (auth.user) {
        await createStudentProfile(
          auth.user.id,
          registrationData.fullName,
          registrationData.email,
          registrationData.phone,
          "free_learner",
        );
        toast.success("Account created. Completing enrollment...");
        window.location.reload(); // Refresh to establish session
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 p-8 container max-w-6xl mx-auto">
          <Skeleton className="h-10 w-64 mb-8" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </main>
      </div>
    );
  if (loadingError || !course)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Navbar />
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-black">Record Not Found</h2>
          <Button onClick={() => navigate("/courses")}>Return to Hub</Button>
        </div>
      </div>
    );

  const config = contentTypeConfig[course.content_type];
  const Icon = config.icon;
  const isFull = course.max_capacity && course.current_enrollment >= course.max_capacity;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <Navbar />

      <div className="relative w-full overflow-hidden border-b border-border/40">
        {course.cover_image_url ? (
          <div className="relative h-[400px] md:h-[500px]">
            <img
              src={course.cover_image_url}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-black/20" />
          </div>
        ) : (
          <div className={cn("h-[300px] md:h-[350px] bg-gradient-to-br opacity-90", config.color)} />
        )}

        <div
          className={cn(
            "absolute inset-0 container max-w-6xl mx-auto px-6 flex flex-col justify-end pb-12",
            !course.cover_image_url && "relative pt-12",
          )}
        >
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Button
              variant="ghost"
              onClick={() => navigate("/courses")}
              className="rounded-full bg-background/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 px-4 h-9 uppercase text-[10px] font-black tracking-widest"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Nexus
            </Button>
            <div className="space-y-4 max-w-4xl">
              <Badge className="bg-primary text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1">
                {config.label}
              </Badge>
              <h1
                className={cn(
                  "text-4xl md:text-6xl font-black tracking-tighter leading-tight",
                  course.cover_image_url ? "text-white" : "text-foreground",
                )}
              >
                {course.title}
              </h1>
              <div
                className={cn(
                  "flex flex-wrap gap-6 text-sm font-bold uppercase tracking-widest",
                  course.cover_image_url ? "text-white/80" : "text-muted-foreground",
                )}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> {course.instructor_name}
                </div>
                {course.duration_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> {course.duration_hours}h
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr,380px] gap-12 items-start">
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-4 w-4" /> Executive Summary
              </div>
              <Card className="rounded-[32px] border-border/40 bg-card/50 backdrop-blur-sm shadow-2xl shadow-primary/5">
                <CardContent className="p-8">
                  <p className="text-lg leading-relaxed font-medium text-foreground/80 whitespace-pre-wrap">
                    {course.description}
                  </p>
                </CardContent>
              </Card>
            </section>

            {course.youtube_url && (
              <section className="space-y-4">
                <AspectRatio
                  ratio={16 / 9}
                  className="rounded-[32px] overflow-hidden shadow-2xl border border-border/40 bg-muted"
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${course.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </AspectRatio>
              </section>
            )}

            <section className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Instructor", val: course.instructor_name, icon: Users },
                { label: "Curriculum", val: `${course.modules_count || 12} Lessons`, icon: GraduationCap },
                { label: "Location", val: course.venue_name || "Virtual Classroom", icon: MapPin },
                { label: "Access", val: "Lifetime", icon: Clock },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-muted/30 border border-border/20">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {item.label}
                    </p>
                    <p className="text-sm font-bold truncate">{item.val}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <aside className="sticky top-24">
            <Card className="rounded-[40px] border-primary/10 shadow-2xl bg-card/80 backdrop-blur-xl overflow-hidden">
              <CardHeader className="p-8 pb-4 text-center">
                <CardTitle className="text-2xl font-black tracking-tighter">
                  {isEnrolled ? "Access Active" : user ? "Enroll Now" : "Platform Entry"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                {isEnrolled ? (
                  <Button
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                    onClick={() => navigate("/my-learning")}
                  >
                    Enter Classroom
                  </Button>
                ) : user ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-black text-primary">${course.price}</p>
                    </div>
                    <Button
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl"
                      onClick={handleQuickEnroll}
                      disabled={isEnrolling || isFull}
                    >
                      {isEnrolling ? <RefreshCw className="animate-spin h-4 w-4" /> : "Finalize Enrollment"}
                    </Button>
                    {course.price > 0 && (
                      <Button
                        variant="outline"
                        className="w-full h-12 rounded-xl text-[10px] font-black uppercase"
                        onClick={() => setShowAccessCodeDialog(true)}
                      >
                        Unlock with Code
                      </Button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSignupAndEnroll} className="space-y-4">
                    <Input
                      placeholder="Full Name"
                      value={registrationData.fullName}
                      onChange={(e) => setRegistrationData({ ...registrationData, fullName: e.target.value })}
                      className="rounded-xl"
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={registrationData.email}
                      onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                      className="rounded-xl"
                      required
                    />
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={registrationData.password}
                        onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                        className="rounded-xl pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 rounded-2xl font-black uppercase tracking-widest"
                      disabled={isEnrolling}
                    >
                      Authorize & Enroll
                    </Button>
                  </form>
                )}
                <Separator />
                <CourseShareButtons title={course.title} url={currentUrl} />
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />

      {course && (
        <AccessCodeDialog
          open={showAccessCodeDialog}
          onOpenChange={setShowAccessCodeDialog}
          contentId={course.id}
          contentTitle={course.title}
          onSuccess={() => {
            setIsEnrolled(true);
            fetchCourse();
          }}
        />
      )}
    </div>
  );
};

export default CourseDetail;
