import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTalent } from "@/hooks/useTalent";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { ProfileCompletionPrompt } from "@/components/profile/ProfileCompletionPrompt";
import { 
  User, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Award,
  ClipboardCheck,
  MessageSquare,
  DollarSign,
  Send,
  BookOpen,
  ExternalLink,
  Linkedin,
  Globe,
  Phone,
  Mail,
  Edit,
  Upload,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

interface ServiceActivity {
  type: 'assessment' | 'interview' | 'salary' | 'application' | 'enrollment';
  id: string;
  title: string;
  date: string;
  status?: string;
  score?: number;
}

const SERVICE_ICONS = {
  assessment: ClipboardCheck,
  interview: MessageSquare,
  salary: DollarSign,
  application: Send,
  enrollment: BookOpen,
};

const SERVICE_LABELS = {
  assessment: 'Career Assessment',
  interview: 'Mock Interview',
  salary: 'Salary Analysis',
  application: 'Job Application',
  enrollment: 'Course Enrollment',
};

export default function TalentPortal() {
  const navigate = useNavigate();
  const { talent, isLoading, isAuthenticated, updateTalent } = useTalent();
  const [activities, setActivities] = useState<ServiceActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [professionName, setProfessionName] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth", { state: { returnTo: "/my-profile" } });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Fetch profession name
  useEffect(() => {
    if (talent?.professionCategoryId) {
      supabase
        .from("profession_categories")
        .select("name")
        .eq("id", talent.professionCategoryId)
        .single()
        .then(({ data }) => {
          if (data) setProfessionName(data.name);
        });
    }
  }, [talent?.professionCategoryId]);

  // Fetch user's activities across all services
  useEffect(() => {
    if (!talent?.id) return;

    const fetchActivities = async () => {
      setActivitiesLoading(true);
      const allActivities: ServiceActivity[] = [];

      try {
        // Fetch career assessments
        const { data: assessments } = await supabase
          .from("career_assessments")
          .select("id, created_at, percentage, readiness_level")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (assessments) {
          assessments.forEach(a => {
            allActivities.push({
              type: 'assessment',
              id: a.id,
              title: `Career Readiness: ${a.readiness_level}`,
              date: a.created_at,
              score: a.percentage,
              status: a.readiness_level,
            });
          });
        }

        // Fetch mock interviews
        const { data: interviews } = await supabase
          .from("mock_interviews")
          .select("id, created_at, job_title, status, selection_percentage, performance_level")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (interviews) {
          interviews.forEach(i => {
            allActivities.push({
              type: 'interview',
              id: i.id,
              title: i.job_title || 'Mock Interview',
              date: i.created_at,
              score: i.selection_percentage,
              status: i.status,
            });
          });
        }

        // Fetch salary analyses
        const { data: salaryAnalyses } = await supabase
          .from("salary_analyses")
          .select("id, created_at, job_title, status")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (salaryAnalyses) {
          salaryAnalyses.forEach(s => {
            allActivities.push({
              type: 'salary',
              id: s.id,
              title: s.job_title || 'Salary Analysis',
              date: s.created_at,
              status: s.status,
            });
          });
        }

        // Fetch job applications
        const { data: applications } = await supabase
          .from("job_applications")
          .select("id, created_at, application_status, job:jobs(title)")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (applications) {
          applications.forEach(a => {
            const jobTitle = (a.job as any)?.title || 'Job Application';
            allActivities.push({
              type: 'application',
              id: a.id,
              title: jobTitle,
              date: a.created_at,
              status: a.application_status,
            });
          });
        }

        // Fetch enrollments
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("id, created_at, status, content:content(title)")
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (enrollments) {
          enrollments.forEach(e => {
            const courseTitle = (e.content as any)?.title || 'Course';
            allActivities.push({
              type: 'enrollment',
              id: e.id,
              title: courseTitle,
              date: e.created_at,
              status: e.status,
            });
          });
        }

        // Sort by date
        allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivities(allActivities);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchActivities();
  }, [talent?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <CardTitle>Profile Not Found</CardTitle>
              <CardDescription>
                We couldn't find your profile. Please sign in again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = talent.fullName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasCV = !!talent.cvUrl;
  const hasExperience = talent.experience.length > 0;
  const hasEducation = talent.education.length > 0;
  const hasSkills = talent.skills.length > 0;

  const profileCompleteness = [
    !!talent.fullName,
    !!talent.email,
    !!talent.phone,
    hasCV,
    hasExperience,
    hasEducation,
    hasSkills,
    !!talent.linkedinUrl,
  ].filter(Boolean).length / 8 * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Profile Completion Prompt */}
          <ProfileCompletionPrompt variant="banner" />
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={talent.profilePhotoUrl || undefined} alt={talent.fullName} />
                  <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <h1 className="text-2xl font-bold">{talent.fullName}</h1>
                    {talent.isFeatured && (
                      <Badge variant="secondary" className="w-fit">
                        <Award className="h-3 w-3 mr-1" />
                        Featured Talent
                      </Badge>
                    )}
                  </div>

                  {(professionName || talent.customProfession) && (
                    <p className="text-lg text-muted-foreground">
                      {talent.customProfession || professionName}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {talent.email}
                    </span>
                    {talent.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {talent.phone}
                      </span>
                    )}
                    {talent.linkedinUrl && (
                      <a 
                        href={talent.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    )}
                    {talent.portfolioUrl && (
                      <a 
                        href={talent.portfolioUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Globe className="h-4 w-4" />
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Button>
                </div>
              </div>

              {/* Profile Completeness */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Profile Completeness</span>
                  <span className="text-sm font-medium">{Math.round(profileCompleteness)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${profileCompleteness}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="cv">CV & Profile</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <ClipboardCheck className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {activities.filter(a => a.type === 'assessment').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Assessments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <MessageSquare className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {activities.filter(a => a.type === 'interview').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Interviews</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Send className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {activities.filter(a => a.type === 'application').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Applications</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <BookOpen className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {activities.filter(a => a.type === 'enrollment').length}
                        </p>
                        <p className="text-xs text-muted-foreground">Courses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Services Used */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Services Used</CardTitle>
                  <CardDescription>Track your journey across our career services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {(['assessment', 'interview', 'salary', 'application', 'enrollment'] as const).map((service) => {
                      const Icon = SERVICE_ICONS[service];
                      const count = activities.filter(a => a.type === service).length;
                      const isUsed = count > 0;
                      
                      return (
                        <div 
                          key={service}
                          className={`p-4 rounded-lg border text-center transition-colors ${
                            isUsed 
                              ? 'bg-primary/5 border-primary/20' 
                              : 'bg-muted/50 border-transparent'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mx-auto mb-2 ${
                            isUsed ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <p className="text-xs font-medium">{SERVICE_LABELS[service]}</p>
                          {isUsed && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {count} completed
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>No activity yet</p>
                      <p className="text-sm">Start using our career services to see your progress here</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => navigate("/career-services")}
                      >
                        Explore Services
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, 5).map((activity) => {
                        const Icon = SERVICE_ICONS[activity.type];
                        return (
                          <div 
                            key={`${activity.type}-${activity.id}`}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {SERVICE_LABELS[activity.type]} • {format(new Date(activity.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            {activity.score !== undefined && (
                              <Badge variant="outline">{activity.score}%</Badge>
                            )}
                            {activity.status && !activity.score && (
                              <Badge variant="secondary" className="capitalize">
                                {activity.status.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* CV & Profile Tab */}
            <TabsContent value="cv" className="space-y-4">
              {/* CV Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        CV / Resume
                      </CardTitle>
                      <CardDescription>
                        {hasCV 
                          ? `Last updated: ${talent.cvParsedAt ? format(new Date(talent.cvParsedAt), 'MMM d, yyyy') : 'Unknown'}`
                          : 'Upload your CV to auto-fill job applications'
                        }
                      </CardDescription>
                    </div>
                    {hasCV && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={talent.cvUrl!} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View CV
                        </a>
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!hasCV ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center">
                      <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-muted-foreground mb-3">
                        Upload your CV to streamline job applications
                      </p>
                      <Button variant="outline" onClick={() => navigate("/jobs")}>
                        Apply for a Job to Upload CV
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="font-medium">CV on file</p>
                        <p className="text-sm text-muted-foreground">
                          Your CV is saved and will be used for future job applications
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Experience */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasExperience ? (
                    <p className="text-muted-foreground text-center py-4">
                      No experience data yet. Upload a CV to populate this section.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {talent.experience.map((exp: any, index: number) => (
                        <div key={index} className="border-l-2 border-primary/30 pl-4">
                          <p className="font-medium">{exp.title || exp.position || 'Position'}</p>
                          <p className="text-sm text-muted-foreground">{exp.company || exp.organization}</p>
                          {(exp.startDate || exp.duration) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {exp.duration || `${exp.startDate} - ${exp.endDate || 'Present'}`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Education */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasEducation ? (
                    <p className="text-muted-foreground text-center py-4">
                      No education data yet. Upload a CV to populate this section.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {talent.education.map((edu: any, index: number) => (
                        <div key={index} className="border-l-2 border-primary/30 pl-4">
                          <p className="font-medium">{edu.degree || edu.qualification}</p>
                          <p className="text-sm text-muted-foreground">{edu.institution || edu.school}</p>
                          {(edu.year || edu.graduationYear) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {edu.year || edu.graduationYear}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasSkills ? (
                    <p className="text-muted-foreground text-center py-4">
                      No skills data yet. Upload a CV to populate this section.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {talent.skills.map((skill: any, index: number) => (
                        <Badge key={index} variant="secondary">
                          {typeof skill === 'string' ? skill : skill.name || skill.skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Activity</CardTitle>
                  <CardDescription>
                    Complete history of your interactions with our services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {activitiesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium">No activity yet</p>
                      <p className="text-sm mt-1">
                        Start your career journey by exploring our services
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        <Button variant="outline" onClick={() => navigate("/career-assessment")}>
                          Take Assessment
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/mock-interview")}>
                          Mock Interview
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/jobs")}>
                          Browse Jobs
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activities.map((activity) => {
                        const Icon = SERVICE_ICONS[activity.type];
                        return (
                          <div 
                            key={`${activity.type}-${activity.id}`}
                            className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => {
                              // Navigate to results page based on type
                              if (activity.type === 'assessment') {
                                navigate(`/assessment-results/${activity.id}`);
                              } else if (activity.type === 'interview') {
                                navigate(`/mock-interview/results/${activity.id}`);
                              } else if (activity.type === 'salary') {
                                navigate(`/salary-analysis/results/${activity.id}`);
                              }
                            }}
                          >
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {SERVICE_LABELS[activity.type]}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(activity.date), 'MMM d, yyyy')}
                              </p>
                              {activity.score !== undefined && (
                                <Badge variant="outline" className="mt-1">{activity.score}%</Badge>
                              )}
                              {activity.status && !activity.score && (
                                <Badge variant="secondary" className="mt-1 capitalize">
                                  {activity.status.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Profile Edit Dialog */}
          {talent && (
            <ProfileEditDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              talent={talent}
              onSave={updateTalent}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
