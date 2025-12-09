import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Users, BookOpen, DollarSign, Video, Plus, Key, Image, Calendar, ClipboardList, Briefcase, MessageSquare, Target, GraduationCap, RefreshCw, AlertCircle, TrendingUp } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import ContentList from "@/components/dashboard/ContentList";
import { AccessCodeManager } from "@/components/AccessCodeManager";
import { BannerManager } from "@/components/dashboard/BannerManager";
import { AssessmentLeadsManager } from "@/components/dashboard/AssessmentLeadsManager";
import PortfolioRequestsManager from "@/components/dashboard/PortfolioRequestsManager";
import { MockInterviewLeadsManager } from "@/components/dashboard/MockInterviewLeadsManager";
import { ProfessionsManager } from "@/components/dashboard/ProfessionsManager";
import { SalaryAnalysisLeadsManager } from "@/components/dashboard/SalaryAnalysisLeadsManager";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLearners: 0,
    activeEnrollments: 0,
    revenue: 0,
    freeVideoViews: 0,
    mockInterviews: {
      total: 0,
      completed: 0,
      avgScore: 0,
    },
    portfolios: {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      freeRemaining: 0,
    },
  });
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    setIsLoading(false);
  };

  const loadStats = async () => {
    setStatsError(null);
    try {
      // Load students count
      const { count: studentsCount, error: studentsError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      if (studentsError) throw studentsError;

      // Load active enrollments
      const { count: enrollmentsCount, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (enrollmentsError) throw enrollmentsError;

      // Calculate revenue (sum of payment_amount)
      const { data: enrollments, error: revenueError } = await supabase
        .from("enrollments")
        .select("payment_amount")
        .not("payment_amount", "is", null);
      if (revenueError) throw revenueError;

      const totalRevenue = enrollments?.reduce((sum, e) => sum + (Number(e.payment_amount) || 0), 0) || 0;

      // Count free videos
      const { count: videoCount, error: videoError } = await supabase
        .from("content")
        .select("*", { count: "exact", head: true })
        .eq("content_type", "free_video");
      if (videoError) throw videoError;

      // Mock interview stats
      const { data: interviews, error: interviewsError } = await supabase
        .from("mock_interviews")
        .select("status, selection_percentage");
      if (interviewsError) throw interviewsError;

      const totalInterviews = interviews?.length || 0;
      const completedInterviews = interviews?.filter(i => i.status === "completed").length || 0;
      const completedWithScores = interviews?.filter(i => i.status === "completed" && i.selection_percentage != null) || [];
      const avgScore = completedWithScores.length > 0 
        ? Math.round(completedWithScores.reduce((sum, i) => sum + (i.selection_percentage || 0), 0) / completedWithScores.length)
        : 0;

      // Portfolio stats
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("portfolio_requests")
        .select("status");
      if (portfolioError) throw portfolioError;

      const totalPortfolios = portfolioData?.length || 0;
      const pendingPortfolios = portfolioData?.filter(p => p.status === "pending").length || 0;
      const inProgressPortfolios = portfolioData?.filter(p => p.status === "in_progress" || p.status === "contacted").length || 0;
      const completedPortfolios = portfolioData?.filter(p => p.status === "completed").length || 0;
      const FREE_LIMIT = 1000;

      setStats({
        totalLearners: studentsCount || 0,
        activeEnrollments: enrollmentsCount || 0,
        revenue: totalRevenue,
        freeVideoViews: videoCount || 0,
        mockInterviews: {
          total: totalInterviews,
          completed: completedInterviews,
          avgScore: avgScore,
        },
        portfolios: {
          total: totalPortfolios,
          pending: pendingPortfolios,
          inProgress: inProgressPortfolios,
          completed: completedPortfolios,
          freeRemaining: Math.max(0, FREE_LIMIT - totalPortfolios),
        },
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
      setStatsError("Failed to load dashboard statistics");
      toast.error("Failed to load statistics");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
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
              <h1 className="text-xl font-bold">GroUp Academy</h1>
              <p className="text-xs text-muted-foreground">Operations Portal</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        {statsError ? (
          <Card className="mb-8">
            <CardContent className="py-6 text-center">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground mb-3">{statsError}</p>
              <Button onClick={loadStats} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <StatsCard
            title="Total Learners"
            value={stats.totalLearners}
            icon={Users}
          />
          <StatsCard
            title="Active Enrollments"
            value={stats.activeEnrollments}
            icon={BookOpen}
            variant="secondary"
          />
          <StatsCard
            title="Revenue (Month)"
            value={`BDT ${stats.revenue.toLocaleString()}`}
            icon={DollarSign}
            variant="success"
          />
          <StatsCard
            title="Free Video Views"
            value={stats.freeVideoViews}
            icon={Video}
            variant="accent"
          />
          <StatsCard
            title="Mock Interviews"
            value={stats.mockInterviews.total}
            icon={Target}
            variant="default"
            trend={stats.mockInterviews.total > 0 ? `${Math.round((stats.mockInterviews.completed / stats.mockInterviews.total) * 100)}% completed` : undefined}
            trendLabel={stats.mockInterviews.avgScore > 0 ? `• Avg: ${stats.mockInterviews.avgScore}%` : undefined}
          />
          <StatsCard
            title="Portfolio Requests"
            value={stats.portfolios.total}
            icon={Briefcase}
            variant="secondary"
            trend={`${stats.portfolios.freeRemaining} free slots left`}
            trendLabel={stats.portfolios.pending > 0 ? `• ${stats.portfolios.pending} pending` : undefined}
          />
        </div>
        )}
        {/* Content Management */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TabsList>
              <TabsTrigger value="all">All Content</TabsTrigger>
              <TabsTrigger value="videos">Free Videos</TabsTrigger>
              <TabsTrigger value="courses">Recorded Courses</TabsTrigger>
              <TabsTrigger value="webinars">Webinars</TabsTrigger>
              <TabsTrigger value="batches">Batch Classes</TabsTrigger>
              <TabsTrigger value="seminars">Seminars</TabsTrigger>
              <TabsTrigger value="codes">
                <Key className="w-4 h-4 mr-2" />
                Access Codes
              </TabsTrigger>
              <TabsTrigger value="banners">
                <Image className="w-4 h-4 mr-2" />
                Banners
              </TabsTrigger>
              <TabsTrigger value="leads">
                <ClipboardList className="w-4 h-4 mr-2" />
                Assessment Leads
              </TabsTrigger>
              <TabsTrigger value="portfolios">
                <Briefcase className="w-4 h-4 mr-2" />
                Portfolios
              </TabsTrigger>
              <TabsTrigger value="interviews">
                <MessageSquare className="w-4 h-4 mr-2" />
                Mock Interviews
              </TabsTrigger>
              <TabsTrigger value="salary">
                <TrendingUp className="w-4 h-4 mr-2" />
                Salary Analysis
              </TabsTrigger>
              <TabsTrigger value="professions">
                <GraduationCap className="w-4 h-4 mr-2" />
                Professions
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate("/students")}>
                <Users className="w-4 h-4 mr-2" />
                Students
              </Button>
              <Button variant="outline" onClick={() => navigate("/enrollments")}>
                <BookOpen className="w-4 h-4 mr-2" />
                Enrollments
              </Button>
              <Button variant="outline" onClick={() => navigate("/instructors")}>
                <Users className="w-4 h-4 mr-2" />
                Instructors
              </Button>
              <Button variant="outline" onClick={() => navigate("/sessions")}>
                <Calendar className="w-4 h-4 mr-2" />
                Sessions
              </Button>
              <Button onClick={() => navigate("/content/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </div>
          </div>

          <TabsContent value="all">
            <ContentList />
          </TabsContent>
          <TabsContent value="videos">
            <ContentList filter="free_video" />
          </TabsContent>
          <TabsContent value="courses">
            <ContentList filter="recorded_course" />
          </TabsContent>
          <TabsContent value="webinars">
            <ContentList filter="live_webinar" />
          </TabsContent>
          <TabsContent value="batches">
            <ContentList filter="batch_class" />
          </TabsContent>
          <TabsContent value="seminars">
            <ContentList filter="offline_seminar" />
          </TabsContent>
          <TabsContent value="codes">
            <AccessCodeManager />
          </TabsContent>
          <TabsContent value="banners">
            <BannerManager />
          </TabsContent>
          <TabsContent value="leads">
            <AssessmentLeadsManager />
          </TabsContent>
          <TabsContent value="portfolios">
            <PortfolioRequestsManager />
          </TabsContent>
          <TabsContent value="interviews">
            <MockInterviewLeadsManager />
          </TabsContent>
          <TabsContent value="salary">
            <SalaryAnalysisLeadsManager />
          </TabsContent>
          <TabsContent value="professions">
            <ProfessionsManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
