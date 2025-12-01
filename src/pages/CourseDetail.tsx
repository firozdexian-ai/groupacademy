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
import { ProfileCompletionForm } from "@/components/ProfileCompletionForm";
import { GraduationCap, Video, BookOpen, Calendar, Users, MapPin, Clock, ArrowLeft, CheckCircle, Play, MessageCircle, Key, Youtube } from "lucide-react";
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
  whatsapp_group_link: string | null;
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
  const [error, setError] = useState<string | null>(null);

  // Registration form for new users
  const [registrationData, setRegistrationData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuth();
    fetchCourse();
  }, [slug]);

  useEffect(() => {
    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Fetch student profile when auth state changes
          const { data: student } = await supabase
            .from("students")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle();
          setStudentProfile(student);
          
          // Check enrollment status
          if (student && course) {
            const { data: enrollment } = await supabase
              .from("enrollments")
              .select("id")
              .eq("student_id", student.id)
              .eq("content_id", course.id)
              .maybeSingle();
            setIsEnrolled(!!enrollment);
          }
        } else {
          setUser(null);
          setStudentProfile(null);
          setIsEnrolled(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [course]);

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
      setError("Failed to load course. Please try again later.");
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
    setIsEnrolling(true);

    try {
      // Step 1: Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("Signup failed");

      // Step 2: Wait for session to establish (fixes race condition)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Refresh the session to ensure we have valid auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Session not established. Please try signing in.");
      }

      // Step 3: Create student profile with retry logic and exponential backoff
      const maxRetries = 3;
      const delays = [500, 1000, 2000];
      let studentData = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const { data, error: studentError } = await supabase
            .from("students")
            .insert([
              {
                user_id: authData.user.id,
                full_name: registrationData.fullName,
                email: registrationData.email,
                phone: registrationData.phone || "",
                student_id: "", // Auto-generated by trigger
              },
            ])
            .select()
            .single();
          
          if (studentError) {
            if (studentError.code === '23505') {
              await new Promise(resolve => setTimeout(resolve, 300));
              const { data: existingStudent } = await supabase
                .from("students")
                .select("*")
                .eq("user_id", authData.user.id)
                .maybeSingle();
              
              if (existingStudent) {
                studentData = existingStudent;
                break;
              }
            }
            throw studentError;
          }
          
          studentData = data;
          break;
        } catch (error: any) {
          console.error(`Profile creation attempt ${attempt + 1} failed:`, error);
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delays[attempt]));
          }
        }
      }

      if (!studentData) {
        toast.error("Account created! Please complete your profile to enroll.");
        setUser(authData.user);
        setStudentProfile(null);
        return;
      }

      // Update local state so UI reflects the new student
      setStudentProfile(studentData);
      setUser(authData.user);

      // Step 4: Create enrollment
      const { error: enrollmentError } = await supabase.from("enrollments").insert([
        {
          student_id: studentData.id,
          content_id: course.id,
          status: course.price && course.price > 0 ? "pending_payment" : "active",
          payment_amount: course.price || 0,
        },
      ]);

      if (enrollmentError) throw enrollmentError;

      toast.success(
        course.price && course.price > 0
          ? "Enrolled! Please complete payment to access the course."
          : "Successfully enrolled in the course!"
      );

      setIsEnrolled(true);
      
      // Redirect to student learning portal
      navigate("/my-learning");
    } catch (error: any) {
      // Better error handling with specific messages
      if (error.message.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else if (error.message.includes("Session not established")) {
        toast.error("Please try signing in to complete enrollment.");
      } else {
        toast.error(error.message || "Failed to enroll. Please try again.");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleQuickEnroll = async () => {
    if (!user) {
      toast.error("Please sign in to enroll");
      return;
    }

    // Check if profile exists first
    if (!studentProfile) {
      toast.error("Please complete your profile below to continue");
      return;
    }

    setIsEnrolling(true);

    try {
      const { error } = await supabase.from("enrollments").insert([
        {
          student_id: studentProfile.id,
          content_id: course.id,
          status: course.price && course.price > 0 ? "pending_payment" : "active",
          payment_amount: course.price || 0,
        },
      ]);

      if (error) {
        if (error.code === '23505') {
          toast.error("You are already enrolled in this course");
        } else {
          throw error;
        }
        return;
      }

      toast.success(
        course.price && course.price > 0
          ? "Enrolled! Please complete payment to access the course."
          : "Successfully enrolled in the course!"
      );
      
      setIsEnrolled(true);
      
      // Redirect to student learning portal
      navigate("/my-learning");
    } catch (error: any) {
      toast.error(error.message || "Failed to enroll. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleProfileComplete = async (profile: any) => {
    setStudentProfile(profile);
    
    // Auto-trigger enrollment after profile completion for free courses
    if (course && course.price === 0) {
      await new Promise(resolve => setTimeout(resolve, 300));
      await handleQuickEnroll();
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

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Course Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "The course you're looking for doesn't exist or has been removed."}
          </p>
          <Button onClick={() => navigate("/courses")} size="lg">
            Browse Courses
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80" />
            
            {/* Content overlaid on cover image */}
            <div className="absolute inset-0 container mx-auto px-6 flex flex-col justify-between">
              <div className="pt-6">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate("/courses")}
                  className="text-white hover:bg-white/20"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Courses
                </Button>
              </div>
              
              <div className="pb-12">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="bg-black/40 text-white border-0 backdrop-blur-sm">
                    <Icon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                  {course.price === 0 ? (
                    <Badge className="bg-success text-success-foreground border-0">Free</Badge>
                  ) : (
                    <Badge className="bg-black/40 text-white border-0 backdrop-blur-sm">
                      BDT {course.price}
                    </Badge>
                  )}
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-6 max-w-4xl">
                  {course.title}
                </h1>
                
                <div className="flex flex-wrap gap-6 text-sm text-white/90 mb-8">
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
        ) : (
          <div className="relative bg-gradient-primary">
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
                  <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0">
                    <Icon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                  {course.price === 0 ? (
                    <Badge className="bg-success text-success-foreground border-0">Free</Badge>
                  ) : (
                    <Badge className="bg-primary-foreground/20 text-primary-foreground border-0">
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
        )}
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
                     <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                       <p className="text-green-600 dark:text-green-400 font-medium">
                         ✓ You're enrolled in this course
                       </p>
                     </div>
                     {course.whatsapp_group_link && (
                       <a href={course.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                         <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                           <MessageCircle className="w-5 h-5 mr-2" />
                           Join Course WhatsApp Group
                         </Button>
                       </a>
                     )}
                     <Button className="w-full" onClick={() => navigate("/my-learning")} variant={course.whatsapp_group_link ? "outline" : "default"}>
                       Go to My Learning
                     </Button>
                     <Separator />
                     <CourseShareButtons title={course.title} url={currentUrl} />
                   </>
                 ) : course.content_type === "free_video" ? (
                   // Free video - YouTube subscribe button only
                   <div className="space-y-4">
                     <a
                       href="https://www.youtube.com/@groupacademi"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="block"
                     >
                       <Button className="w-full bg-red-600 hover:bg-red-700 text-white" size="lg">
                         <Youtube className="w-5 h-5 mr-2" />
                         Subscribe to Our Channel
                       </Button>
                     </a>
                     <p className="text-xs text-center text-muted-foreground">
                       Get notified of new free content
                     </p>
                     <Separator />
                     <CourseShareButtons title={course.title} url={currentUrl} />
                   </div>
                  ) : user ? (
                   <>
                     {!studentProfile ? (
                       <ProfileCompletionForm user={user} onComplete={handleProfileComplete} />
                     ) : course.price > 0 ? (
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
                         {validationErrors.fullName && (
                           <p className="text-sm text-destructive">{validationErrors.fullName}</p>
                         )}
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
                         {validationErrors.email && (
                           <p className="text-sm text-destructive">{validationErrors.email}</p>
                         )}
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
                            minLength={8}
                           value={registrationData.password}
                           onChange={(e) =>
                             setRegistrationData({ ...registrationData, password: e.target.value })
                           }
                         />
                         {validationErrors.password && (
                           <p className="text-sm text-destructive">{validationErrors.password}</p>
                         )}
                         <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                       </div>

                      <Button type="submit" className="w-full" disabled={isEnrolling || isFull}>
                        {isEnrolling ? "Processing..." : isFull ? "Course Full" : "Sign Up & Enroll"}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Already have an account?{" "}
                        <Button 
                          variant="link" 
                          className="p-0 h-auto" 
                          onClick={() => navigate(`/auth?returnTo=${encodeURIComponent(window.location.pathname)}`)}
                        >
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
