import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, Mail, Phone, Briefcase, FileText, ExternalLink, 
  Target, TrendingUp, MessageSquare, Calendar, Award,
  ClipboardList, Building
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface TalentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talentEmail: string;
  talentName?: string;
}

interface TalentActivity {
  type: 'assessment' | 'mock_interview' | 'salary_analysis' | 'portfolio_request';
  id: string;
  date: string;
  status?: string;
  score?: number;
  title?: string;
}

interface TalentProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession_category_id: string | null;
  custom_profession: string | null;
  cv_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  profile_photo_url: string | null;
  services_used: string[];
  created_at: string;
  profession_category?: { name: string } | null;
}

export function TalentDetailDialog({ 
  open, 
  onOpenChange, 
  talentEmail,
  talentName 
}: TalentDetailDialogProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [talent, setTalent] = useState<TalentProfile | null>(null);
  const [activities, setActivities] = useState<TalentActivity[]>([]);

  useEffect(() => {
    if (open && talentEmail) {
      loadTalentData();
    }
  }, [open, talentEmail]);

  const loadTalentData = async () => {
    setLoading(true);
    try {
      // Load talent profile
      const { data: talentData } = await supabase
        .from('talents')
        .select('*, profession_category:profession_categories(name)')
        .ilike('email', talentEmail)
        .single();

      if (talentData) {
        setTalent(talentData as TalentProfile);
      }

      // Load activities in parallel
      const [assessments, interviews, salaryAnalyses, portfolios] = await Promise.all([
        supabase
          .from('career_assessments')
          .select('id, created_at, percentage, readiness_level')
          .ilike('email', talentEmail)
          .order('created_at', { ascending: false }),
        supabase
          .from('mock_interviews')
          .select('id, created_at, selection_percentage, performance_level, status, job_title')
          .ilike('email', talentEmail)
          .order('created_at', { ascending: false }),
        supabase
          .from('salary_analyses')
          .select('id, created_at, status, job_title')
          .ilike('email', talentEmail)
          .order('created_at', { ascending: false }),
        supabase
          .from('portfolio_requests')
          .select('id, created_at, status')
          .ilike('email', talentEmail)
          .order('created_at', { ascending: false })
      ]);

      const allActivities: TalentActivity[] = [];

      assessments.data?.forEach(a => {
        allActivities.push({
          type: 'assessment',
          id: a.id,
          date: a.created_at,
          score: a.percentage,
          status: a.readiness_level
        });
      });

      interviews.data?.forEach(i => {
        allActivities.push({
          type: 'mock_interview',
          id: i.id,
          date: i.created_at,
          score: i.selection_percentage,
          status: i.status,
          title: i.job_title
        });
      });

      salaryAnalyses.data?.forEach(s => {
        allActivities.push({
          type: 'salary_analysis',
          id: s.id,
          date: s.created_at,
          status: s.status,
          title: s.job_title
        });
      });

      portfolios.data?.forEach(p => {
        allActivities.push({
          type: 'portfolio_request',
          id: p.id,
          date: p.created_at,
          status: p.status
        });
      });

      // Sort by date
      allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading talent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <ClipboardList className="h-4 w-4" />;
      case 'mock_interview': return <Target className="h-4 w-4" />;
      case 'salary_analysis': return <TrendingUp className="h-4 w-4" />;
      case 'portfolio_request': return <Briefcase className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'assessment': return 'Career Assessment';
      case 'mock_interview': return 'Mock Interview';
      case 'salary_analysis': return 'Salary Analysis';
      case 'portfolio_request': return 'Portfolio Request';
      default: return type;
    }
  };

  const navigateToResult = (activity: TalentActivity) => {
    switch (activity.type) {
      case 'assessment':
        navigate(`/assessment/results/${activity.id}`);
        break;
      case 'mock_interview':
        if (activity.status === 'completed') {
          navigate(`/mock-interview/results/${activity.id}`);
        }
        break;
      case 'salary_analysis':
        if (activity.status === 'completed') {
          navigate(`/salary-analysis/results/${activity.id}`);
        }
        break;
    }
    onOpenChange(false);
  };

  const formatWhatsAppLink = (phone: string | null) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.startsWith('880')) {
      return `https://wa.me/${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `https://wa.me/880${cleaned.slice(1)}`;
    }
    return `https://wa.me/${cleaned}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {loading ? 'Loading...' : (talent?.full_name || talentName || 'Talent Profile')}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : talent ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="activities">
                Activities ({activities.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-6">
                  {/* Profile Photo */}
                  {talent.profile_photo_url && (
                    <div className="flex justify-center">
                      <img 
                        src={talent.profile_photo_url} 
                        alt={talent.full_name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-border"
                      />
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{talent.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{talent.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {talent.custom_profession || talent.profession_category?.name || 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Joined {format(new Date(talent.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Services Used */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Services Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {talent.services_used && talent.services_used.length > 0 ? (
                        talent.services_used.map((service: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {service.replace('_', ' ')}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No services used yet</span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    {talent.phone && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(formatWhatsAppLink(talent.phone), '_blank')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
                        WhatsApp
                      </Button>
                    )}
                    {talent.cv_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(talent.cv_url!, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View CV
                      </Button>
                    )}
                    {talent.linkedin_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(talent.linkedin_url!, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        LinkedIn
                      </Button>
                    )}
                    {talent.portfolio_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(talent.portfolio_url!, '_blank')}
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Portfolio
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activities" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No activities recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div 
                        key={`${activity.type}-${activity.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigateToResult(activity)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-muted">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {getActivityLabel(activity.type)}
                            </p>
                            {activity.title && (
                              <p className="text-xs text-muted-foreground">{activity.title}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(activity.date), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {activity.score !== undefined && activity.score !== null && (
                            <p className="font-semibold text-sm">{activity.score}%</p>
                          )}
                          {activity.status && (
                            <Badge variant="outline" className="text-xs">
                              {activity.status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Talent not found in database</p>
            <p className="text-sm mt-1">Email: {talentEmail}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
