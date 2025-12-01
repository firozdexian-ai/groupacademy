import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LogOut, BookOpen, Calendar, CheckCircle, Clock, MessageCircle } from "lucide-react";

interface Enrollment {
  id: string;
  status: string;
  enrolled_at: string;
  content: {
    id: string;
    title: string;
    slug: string;
    content_type: string;
    cover_image_url: string | null;
    instructor_name: string | null;
    event_date: string | null;
    whatsapp_group_link: string | null;
  };
}

const MyLearning = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get student profile
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!student) {
        toast.error("Student profile not found");
        navigate("/");
        return;
      }

      setStudentProfile(student);

      // Get enrollments with content details
      const { data: enrollmentData, error } = await supabase
        .from("enrollments")
        .select(`
          id,
          status,
          enrolled_at,
          content:content_id (
            id,
            title,
            slug,
            content_type,
            cover_image_url,
            instructor_name,
            event_date,
            whatsapp_group_link
          )
        `)
        .eq("student_id", student.id)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      setEnrollments(enrollmentData || []);
    } catch (error: any) {
      console.error("Error loading learning data:", error);
      toast.error("Failed to load your courses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const completedEnrollments = enrollments.filter((e) => e.status === "completed");
  const pendingEnrollments = enrollments.filter((e) => e.status === "pending_payment");

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      free_video: "Free Video",
      recorded_course: "Recorded Course",
      live_webinar: "Live Webinar",
      batch_class: "Batch Class",
      offline_seminar: "Offline Seminar",
    };
    return labels[type] || type;
  };

  const renderEnrollmentCard = (enrollment: Enrollment) => (
    <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Cover Image */}
          <div className="sm:w-48 h-32 sm:h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
            {enrollment.content.cover_image_url ? (
              <img
                src={enrollment.content.cover_image_url}
                alt={enrollment.content.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen className="w-12 h-12 text-primary/40" />
            )}
          </div>

          {/* Content Details */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-lg mb-1">{enrollment.content.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {getContentTypeLabel(enrollment.content.content_type)}
                </p>
              </div>
              <Badge variant={enrollment.status === "active" ? "default" : "secondary"}>
                {enrollment.status}
              </Badge>
            </div>

            {enrollment.content.instructor_name && (
              <p className="text-sm text-muted-foreground mb-2">
                Instructor: {enrollment.content.instructor_name}
              </p>
            )}

            {enrollment.content.event_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Calendar className="w-4 h-4" />
                {new Date(enrollment.content.event_date).toLocaleDateString()}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => navigate(`/courses/${enrollment.content.slug}`)}
                size="sm"
              >
                View Course
              </Button>
              {enrollment.content.whatsapp_group_link && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  onClick={() => window.open(enrollment.content.whatsapp_group_link, '_blank')}
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Join Group
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Learning</h1>
              <p className="text-xs text-muted-foreground">
                Welcome back, {studentProfile?.full_name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/courses")} size="sm">
              Browse Courses
            </Button>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeEnrollments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedEnrollments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollments.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Enrollments Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active">
              Active ({activeEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({completedEnrollments.length})
            </TabsTrigger>
            {pendingEnrollments.length > 0 && (
              <TabsTrigger value="pending">
                Pending ({pendingEnrollments.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeEnrollments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No active courses yet</p>
                  <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
                </CardContent>
              </Card>
            ) : (
              activeEnrollments.map(renderEnrollmentCard)
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedEnrollments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed courses yet</p>
                </CardContent>
              </Card>
            ) : (
              completedEnrollments.map(renderEnrollmentCard)
            )}
          </TabsContent>

          {pendingEnrollments.length > 0 && (
            <TabsContent value="pending" className="space-y-4">
              {pendingEnrollments.map(renderEnrollmentCard)}
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default MyLearning;
