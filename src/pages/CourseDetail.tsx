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
import { GraduationCap, Video, BookOpen, Calendar, Users, MapPin, Clock, ArrowLeft, CheckCircle, Play } from "lucide-react";
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
  thumbnail_url: string | null;
  youtube_url: string | null;
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

      // Check if already enrolled
      if (user) {
        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
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
      toast.error("Failed to load course");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-90" />
        
        <div className="relative container mx-auto px-6">
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
      {(course.thumbnail_url || embedUrl) && (
        <div className="bg-card border-b">
          <div className="container mx-auto px-6 py-8">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden shadow-xl">
              {embedUrl ? (
                <div className="relative w-full h-full group">
                  <iframe
                    src={embedUrl}
                    title={course.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : course.thumbnail_url ? (
                <div className="relative w-full h-full group cursor-pointer">
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                  {course.youtube_url && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                        <Play className="h-10 w-10 text-primary-foreground ml-1" fill="currentColor" />
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </AspectRatio>
          </div>
        </div>
      )}

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
                    <Button 
                      className="w-full" 
                      onClick={handleQuickEnroll} 
                      disabled={isEnrolling || isFull}
                    >
                      {isEnrolling ? "Enrolling..." : isFull ? "Course Full" : "Enroll Now"}
                    </Button>
                    <Separator />
                    <CourseShareButtons title={course.title} url={currentUrl} />
                  </>
                ) : (
                  <>
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
    </div>
  );
};

export default CourseDetail;
