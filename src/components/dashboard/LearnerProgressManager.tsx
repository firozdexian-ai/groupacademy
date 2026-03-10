import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, Trophy, TrendingDown, BarChart3, Clock } from "lucide-react";
import { format } from "date-fns";

interface CourseStats {
  contentId: string;
  title: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  averageProgress: number;
  dropOffStage: number | null;
}

interface LearnerDetail {
  enrollmentId: string;
  talentId: string;
  talentName: string;
  talentEmail: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  modulesCompleted: number;
  totalModules: number;
  currentModule: string | null;
  currentStage: number;
}

export function LearnerProgressManager() {
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ["admin-courses-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, content_type")
        .in("content_type", ["recorded_course", "batch_class", "live_webinar"])
        .eq("is_published", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollmentStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-enrollment-stats", selectedCourse],
    queryFn: async () => {
      let query = supabase
        .from("enrollments")
        .select(`
          id, status, content_id, enrolled_at, completed_at,
          content:content_id (id, title, modules_count)
        `);
      if (selectedCourse !== "all") query = query.eq("content_id", selectedCourse);
      const { data, error } = await query;
      if (error) throw error;

      const statsMap = new Map<string, CourseStats>();
      (data || []).forEach((enrollment: any) => {
        const contentId = enrollment.content_id;
        const content = enrollment.content;
        if (!statsMap.has(contentId)) {
          statsMap.set(contentId, {
            contentId, title: content?.title || "Unknown Course",
            totalEnrollments: 0, activeEnrollments: 0, completedEnrollments: 0,
            averageProgress: 0, dropOffStage: null,
          });
        }
        const stats = statsMap.get(contentId)!;
        stats.totalEnrollments++;
        if (enrollment.status === "active") stats.activeEnrollments++;
        else if (enrollment.status === "completed") stats.completedEnrollments++;
      });

      statsMap.forEach((stats) => {
        if (stats.totalEnrollments > 0) {
          stats.averageProgress = Math.round((stats.completedEnrollments / stats.totalEnrollments) * 100);
        }
      });
      return Array.from(statsMap.values());
    },
  });

  const { data: learnerDetails, isLoading: learnersLoading } = useQuery({
    queryKey: ["admin-learner-details", selectedCourse],
    queryFn: async () => {
      let query = supabase
        .from("enrollments")
        .select(`
          id, status, enrolled_at, completed_at, content_id, talent_id,
          talents:talent_id (id, full_name, email),
          content:content_id (id, title, modules_count)
        `)
        .order("enrolled_at", { ascending: false })
        .limit(50);
      if (selectedCourse !== "all") query = query.eq("content_id", selectedCourse);
      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((enrollment: any): LearnerDetail => ({
        enrollmentId: enrollment.id,
        talentId: enrollment.talent_id,
        talentName: enrollment.talents?.full_name || "Unknown",
        talentEmail: enrollment.talents?.email || "",
        status: enrollment.status,
        enrolledAt: enrollment.enrolled_at,
        completedAt: enrollment.completed_at,
        modulesCompleted: enrollment.status === "completed" ? (enrollment.content?.modules_count || 0) : 0,
        totalModules: enrollment.content?.modules_count || 0,
        currentModule: null,
        currentStage: 1,
      }));
    },
  });

  const summaryStats = {
    totalLearners: enrollmentStats?.reduce((sum, s) => sum + s.totalEnrollments, 0) || 0,
    activeLearners: enrollmentStats?.reduce((sum, s) => sum + s.activeEnrollments, 0) || 0,
    completedLearners: enrollmentStats?.reduce((sum, s) => sum + s.completedEnrollments, 0) || 0,
    averageCompletion: enrollmentStats?.length
      ? Math.round(enrollmentStats.reduce((sum, s) => sum + s.averageProgress, 0) / enrollmentStats.length)
      : 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "active":
        return <Badge variant="secondary">Active</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (coursesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Learner Progress</h2>
          <p className="text-xs text-muted-foreground">
            Track learner engagement and course completion rates
          </p>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses?.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Compact KPI Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Learners</p>
              <p className="text-lg font-bold">{summaryStats.totalLearners}</p>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-lg font-bold">{summaryStats.activeLearners}</p>
            </div>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold">{summaryStats.completedLearners}</p>
            </div>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Avg. Completion</p>
              <p className="text-lg font-bold">{summaryStats.averageCompletion}%</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Course Performance */}
      {selectedCourse === "all" && enrollmentStats && enrollmentStats.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Course Performance</CardTitle>
            <CardDescription>Enrollment and completion rates by course</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Completion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentStats.map((stats) => (
                    <TableRow key={stats.contentId}>
                      <TableCell className="font-medium">{stats.title}</TableCell>
                      <TableCell className="text-center">{stats.totalEnrollments}</TableCell>
                      <TableCell className="text-center">{stats.activeEnrollments}</TableCell>
                      <TableCell className="text-center">{stats.completedEnrollments}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Progress value={stats.averageProgress} className="w-16 h-2" />
                          <span className="text-sm text-muted-foreground">{stats.averageProgress}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {enrollmentStats.map((stats) => (
                <Card key={stats.contentId} className="p-3">
                  <p className="font-medium text-sm truncate mb-2">{stats.title}</p>
                  <div className="grid grid-cols-3 gap-2 text-center mb-2">
                    <div>
                      <p className="text-lg font-bold">{stats.totalEnrollments}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stats.activeEnrollments}</p>
                      <p className="text-[10px] text-muted-foreground">Active</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{stats.completedEnrollments}</p>
                      <p className="text-[10px] text-muted-foreground">Completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={stats.averageProgress} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground">{stats.averageProgress}%</span>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Learner Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Individual Learners</CardTitle>
          <CardDescription>
            Detailed progress for each enrolled learner
          </CardDescription>
        </CardHeader>
        <CardContent>
          {learnersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : learnerDetails && learnerDetails.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Learner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {learnerDetails.map((learner) => (
                      <TableRow key={learner.enrollmentId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{learner.talentName}</div>
                            <div className="text-sm text-muted-foreground">{learner.talentEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(learner.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(learner.enrolledAt), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {learner.totalModules > 0 ? (
                            <div className="flex items-center gap-2 justify-center">
                              <Progress
                                value={(learner.modulesCompleted / learner.totalModules) * 100}
                                className="w-16 h-2"
                              />
                              <span className="text-sm text-muted-foreground">
                                {learner.modulesCompleted}/{learner.totalModules}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {learner.completedAt ? (
                            <span className="text-sm text-primary">
                              {format(new Date(learner.completedAt), "MMM d, yyyy")}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">In progress</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden space-y-3">
                {learnerDetails.map((learner) => (
                  <Card key={learner.enrollmentId} className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{learner.talentName}</p>
                        <p className="text-xs text-muted-foreground truncate">{learner.talentEmail}</p>
                      </div>
                      {getStatusBadge(learner.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(learner.enrolledAt), "MMM d, yyyy")}
                      </span>
                      {learner.completedAt && (
                        <span className="text-primary">
                          Done {format(new Date(learner.completedAt), "MMM d")}
                        </span>
                      )}
                    </div>
                    {learner.totalModules > 0 && (
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(learner.modulesCompleted / learner.totalModules) * 100}
                          className="flex-1 h-2"
                        />
                        <span className="text-xs text-muted-foreground">
                          {learner.modulesCompleted}/{learner.totalModules}
                        </span>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No learner data available</p>
              <p className="text-sm">Enrollments will appear here once learners sign up</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
