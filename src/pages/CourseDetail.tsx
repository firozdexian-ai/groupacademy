import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Video, BookOpen, Calendar, Users, MapPin, Clock, ArrowLeft, CheckCircle } from "lucide-react";
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
  event_date: string | null;
  event_duration_minutes: number | null;
  max_capacity: number | null;
  current_enrollment: number;
  venue_name: string | null;
  venue_address: string | null;
  youtube_url: string | null;
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) return null;

  const config = contentTypeConfig[course.content_type];
  const Icon = config.icon;
  const isFull = course.max_capacity && course.current_enrollment >= course.max_capacity;
  const spotsRemaining = course.max_capacity ? course.max_capacity - course.current_enrollment : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" onClick={() => navigate("/courses")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {/* Course Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-6 shadow-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="text-sm">{config.label}</Badge>
                {course.price === 0 ? (
                  <Badge className="bg-green-500 text-sm">Free</Badge>
                ) : (
                  <Badge variant="outline" className="text-sm">BDT {course.price}</Badge>
                )}
              </div>

              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground">{course.description}</p>
            </div>

            <Separator />

            <div className="grid md:grid-cols-2 gap-6">
              {course.instructor_name && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">Instructor</p>
                    <p className="text-muted-foreground">{course.instructor_name}</p>
                  </div>
                </div>
              )}

              {course.event_date && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-primary mt-1" />
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
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">Duration</p>
                    <p className="text-muted-foreground">{course.event_duration_minutes} minutes</p>
                  </div>
                </div>
              )}

              {course.duration_hours && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">Course Duration</p>
                    <p className="text-muted-foreground">{course.duration_hours} hours</p>
                  </div>
                </div>
              )}

              {course.modules_count && (
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">Modules</p>
                    <p className="text-muted-foreground">{course.modules_count} modules</p>
                  </div>
                </div>
              )}

              {course.venue_name && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1" />
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
                  <Users className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <p className="font-semibold">Availability</p>
                    <p className="text-muted-foreground">
                      {spotsRemaining} spots remaining
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Registration Card */}
          <div className="md:col-span-1">
            <Card className="sticky top-24">
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
              <CardContent>
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center py-6">
                      <CheckCircle className="w-16 h-16 text-green-500" />
                    </div>
                    <Button className="w-full" onClick={() => navigate("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </div>
                ) : user ? (
                  <Button 
                    className="w-full" 
                    onClick={handleQuickEnroll} 
                    disabled={isEnrolling || isFull}
                  >
                    {isEnrolling ? "Enrolling..." : isFull ? "Course Full" : "Enroll Now"}
                  </Button>
                ) : (
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
