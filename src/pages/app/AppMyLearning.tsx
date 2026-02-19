import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, CheckCircle, Clock, PlayCircle, MessageCircle } from "lucide-react";

interface EnrollmentContent {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  thumbnail_url: string | null; // Changed from cover_image_url to match Hub
  cover_image_url: string | null; // Kept for compatibility if needed
  instructor_name: string | null;
  event_date: string | null;
  whatsapp_group_link: string | null;
}

interface Enrollment {
  id: string;
  status: string;
  enrolled_at: string;
  completed_at: string | null;
  progress: number; // Added progress field
  content: EnrollmentContent;
}

// Reusable Learning Card Component (Consistent with LearningHub)
const LearningCard = ({ enrollment }: { enrollment: Enrollment }) => {
  const navigate = useNavigate();
  const { content, status, progress } = enrollment;

  // Handle image source priority
  const imageSrc = content.thumbnail_url || content.cover_image_url;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden border-border/50 h-full flex flex-col"
      onClick={() => navigate(`/app/learning/courses/${content.slug}`)}
    >
      <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5">
            <BookOpen className="h-10 w-10 text-primary/20" />
          </div>
        )}

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white/30 transition-colors">
            <PlayCircle className="w-4 h-4" />
            Resume
          </div>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="outline" className="capitalize text-[10px] h-5 px-1.5">
              {content.content_type.replace(/_/g, " ")}
            </Badge>
            <Badge variant={status === "active" ? "default" : "secondary"} className="text-[10px] h-5 px-1.5">
              {status === "pending_payment" ? "Payment Pending" : status}
            </Badge>
          </div>

          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {content.title}
          </h3>

          {content.instructor_name && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-1">By {content.instructor_name}</p>
          )}
        </div>

        {/* Footer Actions / Progress */}
        <div className="space-y-3 mt-auto pt-2">
          {status === "active" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium text-foreground">{progress || 0}%</span>
              </div>
              <Progress value={progress || 0} className="h-1.5" />
            </div>
          )}

          <div className="flex gap-2">
            {content.whatsapp_group_link && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 dark:bg-green-950/20 dark:border-green-900 dark:text-green-400"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(content.whatsapp_group_link!, "_blank");
                }}
              >
                <MessageCircle className="w-3 h-3 mr-1.5" />
                Group
              </Button>
            )}

            {status === "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/report-card/${enrollment.id}`);
                }}
              >
                Certificate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AppMyLearning() {
  const navigate = useNavigate();
  const { talent } = useTalent();

  const {
    data: enrollments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["talent-enrollments", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          status,
          enrolled_at,
          completed_at,
          progress,
          content:content_id (
            id,
            title,
            slug,
            content_type,
            thumbnail_url,
            cover_image_url,
            instructor_name,
            event_date,
            whatsapp_group_link
          )
        `,
        )
        .eq("talent_id", talent!.id)
        .order("last_accessed_at", { ascending: false }); // Sort by recently accessed

      if (error) throw error;
      return data as unknown as Enrollment[];
    },
    enabled: !!talent?.id,
  });

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const completedEnrollments = enrollments.filter((e) => e.status === "completed");
  const pendingEnrollments = enrollments.filter((e) => e.status === "pending_payment");

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Button variant="ghost" onClick={() => navigate("/app/learning")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-4">Failed to load your courses</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/learning")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">My Learning</h1>
          <p className="text-muted-foreground text-sm">Track your progress and achievements</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-primary">Active</CardTitle>
            <Clock className="h-4 w-4 text-primary/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeEnrollments.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600/60 dark:text-green-400/60" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{completedEnrollments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="active">Active ({activeEnrollments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedEnrollments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-0">
          {activeEnrollments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-1">No active courses</h3>
                <p className="text-muted-foreground text-sm mb-4">Start a new course to see it here</p>
                <Button onClick={() => navigate("/app/learning/courses")}>Browse Catalog</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enrollment) => (
                <LearningCard key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          {completedEnrollments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold mb-1">No completed courses</h3>
                <p className="text-muted-foreground text-sm">Finish a course to earn your certificate</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedEnrollments.map((enrollment) => (
                <LearningCard key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
