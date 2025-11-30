import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CourseShareButtons } from "@/components/CourseShareButtons";
import { AccessCodeDialog } from "@/components/AccessCodeDialog";
import { GraduationCap, Video, BookOpen, Calendar, Users, MapPin, Clock, ArrowLeft, CheckCircle, Play, MessageCircle, Key } from "lucide-react";
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
  event_duration_minutes: number | null;
  max_capacity: number | null;
  current_enrollment: number;
  venue_name: string | null;
  venue_address: string | null;
  duration_hours: number | null;
  modules_count: number | null;
}

const contentTypeConfig = {
  free_video: { icon: Video, label: "Free Video", color: "from-blue-500 to-cyan-500" },
  recorded_course: { icon: BookOpen, label: "Recorded Course", color: "from-purple-500 to-pink-500" },
  live_webinar: { icon: Calendar, label: "Live Webinar", color: "from-teal-500 to-green-500" },
  batch_class: { icon: Users, label: "Batch Class", color: "from-emerald-500 to-teal-600" },
  offline_seminar: { icon: MapPin, label: "Offline Seminar", color: "from-orange-500 to-red-500" },
};

const CourseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showAccessCodeDialog, setShowAccessCodeDialog] = useState(false);

  // Registration form for new users
  const [registrationData, setRegistrationData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });

  useEffect(() => {
    checkAuth();
    fetchCourse();
  }, [slug]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      // Fetch student profile
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      setStudentProfile(student);
    }
  };

  const fetchCourse = async () => {
    try {
      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error("Course not found");
        navigate("/courses");
        return;
      }

      setCourse(data);

      // Check if user is already enrolled
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (student) {
          const { data: enrollment } = await supabase
            .from("enrollments")
            .select("id")
            .eq("student_id", student.id)
            .eq("content_id", data.id)
            .maybeSingle();

          setIsEnrolled(!!enrollment);
        }
      }
    } catch (error: any) {
      console.error("Error fetching course:", error);
      toast.error("Failed to load course");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Hi! I want to enroll in "${course?.title}" (BDT ${course?.price}). Please send me the access code after payment confirmation.`
    );
    const whatsappUrl = `https://wa.me/8801708459008?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleSignupAndEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setIsEnrolling(true);
    try {
      // 1. Sign up the user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/courses/${course.slug}`,
        },
      });

      if (signupError) throw signupError;
      if (!authData.user) throw new Error("Signup failed");

      // 2. Create student profile  
      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert({
          user_id: authData.user.id,
          full_name: registrationData.fullName,
          email: registrationData.email,
          phone: registrationData.phone || null,
          status: "enrolled" as const,
        } as any)
        .select()
        .single();

      if (studentError) throw studentError;

      // 3. Create enrollment
      const { error: enrollmentError } = await supabase
        .from("enrollments")
        .insert([
          {
            student_id: student.id,
            content_id: course.id,
            status: course.price === 0 ? "completed" : "pending_payment",
            payment_amount: course.price,
          },
        ]);

      if (enrollmentError) throw enrollmentError;

      // 4. Update enrollment count
      await supabase
        .from("content")
        .update({ current_enrollment: course.current_enrollment + 1 })
        .eq("id", course.id);

      toast.success("Successfully enrolled! Please check your email to verify your account.");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete registration");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleQuickEnroll = async () => {
    if (!course || !studentProfile) return;

    // Check capacity
    if (course.max_capacity && course.current_enrollment >= course.max_capacity) {
      toast.error("Sorry, this course is full");
      return;
    }

    setIsEnrolling(true);
    try {
      const { error: enrollmentError } = await supabase
        .from("enrollments")
        .insert([
          {
            student_id: studentProfile.id,
            content_id: course.id,
            status: course.price === 0 ? "completed" : "pending_payment",
            payment_amount: course.price,
          },
        ]);

      if (enrollmentError) throw enrollmentError;

      // Update enrollment count
      await supabase
        .from("content")
        .update({ current_enrollment: course.current_enrollment + 1 })
        .eq("id", course.id);

      toast.success("Successfully enrolled!");
      setIsEnrolled(true);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to enroll");
    } finally {
      setIsEnrolling(false);
    }
  };

  // Convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string | null) => {
    if (!url) return null;
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return videoIdMatch ? `https://www.youtube.com/embed/${videoIdMatch[1]}` : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) return null;

  const config = contentTypeConfig[course.content_type];
  const Icon = config.icon;
  const isFull = course.max_capacity && course.current_enrollment >= course.max_capacity;
  const spotsRemaining = course.max_capacity ? course.max_capacity - course.current_enrollment : null;
  const currentUrl = window.location.href;
  const embedUrl = getYouTubeEmbedUrl(course.youtube_url);

  return (
    <div className="min-h-screen bg-gradient-muted">
      {/* Hero Section with Cover Image or Gradient Background */}
      <div className="relative overflow-hidden">
        {course.cover_image_url ? (
          <div className="relative h-[400px]">
            <img 
              src={course.cover_image_url} 
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
          </div>
        ) : (
          <div className="relative bg-gradient-primary">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90" />
          </div>
        )}
        
        <div className={`relative container mx-auto px-6 ${course.cover_image_url ? 'absolute inset-0' : ''}`}>
          <div className="pt-6 pb-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/courses")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </div>
          
          <div className="pb-12">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 backdrop-blur-sm">
                <Icon className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
              {course.price === 0 ? (
                <Badge className="bg-success text-success-foreground border-0">Free</Badge>
              ) : (
                <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 backdrop-blur-sm">
                  BDT {course.price}
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6 max-w-4xl">
              {course.title}
            </h1>
            
            <div className="flex flex-wrap gap-6 text-sm text-primary-foreground/90 mb-8">
              {course.instructor_name && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{course.instructor_name}</span>
                </div>
              )}
              {course.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(course.event_date).toLocaleDateString()}</span>
                </div>
              )}
              {course.duration_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration_hours} hours</span>
                </div>
              )}
              {course.event_duration_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{course.event_duration_minutes} minutes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Media Section */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-6 py-8">
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden shadow-xl">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={course.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <div className={`relative w-full h-full bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                <Icon className="w-24 h-24 text-white/30" />
              </div>
            )}
          </AspectRatio>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Course Details */}
          <div className="md:col-span-2 space-y-6">
            {course.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About This Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {course.description}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {course.instructor_name && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Instructor</p>
                        <p className="text-muted-foreground">{course.instructor_name}</p>
                      </div>
                    </div>
                  )}

                  {course.event_date && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Date & Time</p>
                        <p className="text-muted-foreground">
                          {new Date(course.event_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(course.event_date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {course.event_duration_minutes && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Duration</p>
                        <p className="text-muted-foreground">{course.event_duration_minutes} minutes</p>
                      </div>
                    </div>
                  )}

                  {course.duration_hours && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Course Duration</p>
                        <p className="text-muted-foreground">{course.duration_hours} hours</p>
                      </div>
                    </div>
                  )}

                  {course.modules_count && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Modules</p>
                        <p className="text-muted-foreground">{course.modules_count} modules</p>
                      </div>
                    </div>
                  )}

                  {course.venue_name && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Venue</p>
                        <p className="text-muted-foreground">{course.venue_name}</p>
                        {course.venue_address && (
                          <p className="text-sm text-muted-foreground">{course.venue_address}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {spotsRemaining !== null && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Availability</p>
                        <p className="text-muted-foreground">
                          {spotsRemaining} spots remaining
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Registration Card */}
          <div className="md:col-span-1">
            <Card className="sticky top-24 shadow-xl">
              <CardHeader>
                <CardTitle>
                  {isEnrolled ? "You're Enrolled!" : user ? "Enroll Now" : "Register to Enroll"}
                </CardTitle>
                <CardDescription>
                  {isEnrolled 
                    ? "Access this course from your dashboard" 
                    : isFull 
                    ? "This course is currently full" 
                    : user 
                    ? "Complete your enrollment with one click" 
                    : "Create your account to get started"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEnrolled ? (
                  <>
                    <div className="flex items-center justify-center py-6">
                      <CheckCircle className="w-16 h-16 text-success" />
                    </div>
                    <Button className="w-full" onClick={() => navigate("/dashboard")}>
                      Go to Dashboard
                    </Button>
                    <Separator />
                    <CourseShareButtons title={course.title} url={currentUrl} />
                  </>
                 ) : user ? (
                  <>
                    {course.price > 0 ? (
                      <>
                        <div className="space-y-3">
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">This is a paid course</p>
                            <p className="text-sm text-muted-foreground mb-3">
                              Contact admin via WhatsApp to complete payment and receive your access code
                            </p>
                            <Button 
                              className="w-full gap-2" 
                              onClick={handleWhatsAppClick}
                              variant="default"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Get Access Code via WhatsApp
                            </Button>
                          </div>
                          
                          <Separator />
                          
                          <Button 
                            className="w-full gap-2" 
                            variant="outline"
                            onClick={() => setShowAccessCodeDialog(true)}
                          >
                            <Key className="w-4 h-4" />
                            I Have an Access Code
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={handleQuickEnroll} 
                        disabled={isEnrolling || isFull}
                      >
                        {isEnrolling ? "Enrolling..." : isFull ? "Course Full" : "Enroll Now"}
                      </Button>
                    )}
                    <Separator />
                    <CourseShareButtons title={course.title} url={currentUrl} />
                  </>
                ) : (
                  <>
                    {course.price > 0 && (
                      <div className="mb-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Paid Course - BDT {course.price}</p>
                        <p className="text-sm text-muted-foreground">
                          Sign up first, then contact admin via WhatsApp to get your access code
                        </p>
                      </div>
                    )}
                    
                    <form onSubmit={handleSignupAndEnroll} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          required
                          value={registrationData.fullName}
                          onChange={(e) =>
                            setRegistrationData({ ...registrationData, fullName: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={registrationData.email}
                          onChange={(e) =>
                            setRegistrationData({ ...registrationData, email: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={registrationData.phone}
                          onChange={(e) =>
                            setRegistrationData({ ...registrationData, phone: e.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          required
                          minLength={6}
                          value={registrationData.password}
                          onChange={(e) =>
                            setRegistrationData({ ...registrationData, password: e.target.value })
                          }
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isEnrolling || isFull}>
                        {isEnrolling ? "Processing..." : isFull ? "Course Full" : "Sign Up & Enroll"}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Already have an account?{" "}
                        <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/auth")}>
                          Sign in
                        </Button>
                      </p>
                    </form>
                    
                    <Separator />
                    <CourseShareButtons title={course.title} url={currentUrl} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Access Code Dialog */}
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
