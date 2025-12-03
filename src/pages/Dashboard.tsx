import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Users, BookOpen, DollarSign, Video, Plus, Key, Image, Calendar, ClipboardList } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import ContentList from "@/components/dashboard/ContentList";
import { AccessCodeManager } from "@/components/AccessCodeManager";
import { BannerManager } from "@/components/dashboard/BannerManager";
import { AssessmentLeadsManager } from "@/components/dashboard/AssessmentLeadsManager";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLearners: 0,
    activeEnrollments: 0,
    revenue: 0,
    freeVideoViews: 0,
  });

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
    try {
      // Load students count
      const { count: studentsCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      // Load active enrollments
      const { count: enrollmentsCount } = await supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Calculate revenue (sum of payment_amount)
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("payment_amount")
        .not("payment_amount", "is", null);

      const totalRevenue = enrollments?.reduce((sum, e) => sum + (Number(e.payment_amount) || 0), 0) || 0;

      // Count free videos
      const { count: videoCount } = await supabase
        .from("content")
        .select("*", { count: "exact", head: true })
        .eq("content_type", "free_video");

      setStats({
        totalLearners: studentsCount || 0,
        activeEnrollments: enrollmentsCount || 0,
        revenue: totalRevenue,
        freeVideoViews: videoCount || 0,
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        </div>

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
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
