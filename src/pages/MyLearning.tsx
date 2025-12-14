import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { ProfileCompletionForm } from "@/components/ProfileCompletionForm";
import { BookOpen, Calendar, CheckCircle, Clock, MessageCircle } from "lucide-react";
import { PageLoadingSkeleton } from "@/components/ui/page-loading-skeleton";
import { ErrorState } from "@/components/ui/error-state";

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
  const { user, signOut } = useAuth();

  // Fetch student profile
  const { data: studentProfile, isLoading: profileLoading, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    retry: 2,
  });

  // Fetch enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading, error: enrollmentsError, refetch: refetchEnrollments } = useQuery({
    queryKey: ["enrollments", studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile) return [];
      
      const { data, error } = await supabase
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
        .eq("student_id", studentProfile.id)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      return data as Enrollment[];
    },
    enabled: !!studentProfile?.id,
    retry: 2,
  });

  const isLoading = profileLoading || enrollmentsLoading;

  const handleProfileComplete = () => {
    refetchProfile();
    refetchEnrollments();
  };

  // Redirect if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  // Loading state
  if (isLoading) {
    return <PageLoadingSkeleton showNavbar variant="dashboard" title="My Learning" />;
  }

  // Error state
  if (profileError || enrollmentsError) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 sm:px-6 py-8">
          <ErrorState
            type="server"
            title="Failed to load your courses"
            description="We couldn't load your learning data. Please try again."
            onRetry={() => {
              refetchProfile();
              refetchEnrollments();
            }}
          />
        </main>
      </div>
    );
  }

  // Show profile completion form if profile is missing
  if (!studentProfile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-md w-full">
            <ProfileCompletionForm user={user} onComplete={handleProfileComplete} />
          </div>
        </div>
      </>
    );
  }

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
          <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden shrink-0">
            {enrollment.content.cover_image_url ? (
              <img
                src={enrollment.content.cover_image_url}
                alt={enrollment.content.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <BookOpen className="w-12 h-12 text-primary/40" />
            )}
          </div>

          {/* Content Details */}
          <div className="flex-1 p-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-base sm:text-lg mb-1">{enrollment.content.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {getContentTypeLabel(enrollment.content.content_type)}
                </p>
              </div>
              <Badge variant={enrollment.status === "active" ? "default" : "secondary"} className="shrink-0">
                {enrollment.status}
              </Badge>
            </div>

            {enrollment.content.instructor_name && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Instructor: {enrollment.content.instructor_name}
              </p>
            )}

            {enrollment.content.event_date && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
                <Calendar className="w-4 h-4" />
                {new Date(enrollment.content.event_date).toLocaleDateString()}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate(`/learn/${enrollment.content.slug}`)}
                size="sm"
              >
                Continue Learning
              </Button>
              {enrollment.status === "completed" && (
                <Button
                  onClick={() => navigate(`/report-card/${enrollment.id}`)}
                  variant="outline"
                  size="sm"
                >
                  Download Report Card
                </Button>
              )}
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
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
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="active" className="flex-1 sm:flex-none">
              Active ({activeEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 sm:flex-none">
              Completed ({completedEnrollments.length})
            </TabsTrigger>
            {pendingEnrollments.length > 0 && (
              <TabsTrigger value="pending" className="flex-1 sm:flex-none">
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
