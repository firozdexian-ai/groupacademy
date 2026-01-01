import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  ChevronRight, 
  Calendar,
  Building2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardList,
  Loader2,
  PlayCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  created_at: string;
  application_status: string;
  delivery_status: string;
  ai_assessment_enabled: boolean;
  assessment_id: string | null;
  assessment_status: string | null;
}

export default function MyApplications() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingAssessment, setGeneratingAssessment] = useState<string | null>(null);

  useEffect(() => {
    if (talent?.id) {
      fetchApplications();
    }
  }, [talent?.id]);

  async function fetchApplications() {
    if (!talent?.id) return;
    
    setLoading(true);
    try {
      // First fetch applications with job info
      const { data: appData, error: appError } = await supabase
        .from('job_applications')
        .select(`
          id,
          job_id,
          created_at,
          application_status,
          delivery_status,
          jobs (
            title,
            company_name,
            ai_assessment_enabled
          )
        `)
        .eq('talent_id', talent.id)
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      // Then fetch assessments for this talent
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('job_assessments')
        .select('id, job_id, status')
        .eq('talent_id', talent.id);

      if (assessmentError) throw assessmentError;

      // Create a map of job_id to assessment
      const assessmentMap = new Map(
        assessmentData?.map(a => [a.job_id, { id: a.id, status: a.status }]) || []
      );

      const formatted = appData?.map(app => {
        const assessment = assessmentMap.get(app.job_id);
        return {
          id: app.id,
          job_id: app.job_id,
          job_title: (app.jobs as any)?.title || 'Unknown Job',
          company_name: (app.jobs as any)?.company_name || 'Unknown Company',
          created_at: app.created_at,
          application_status: app.application_status || 'submitted',
          delivery_status: app.delivery_status || 'pending',
          ai_assessment_enabled: (app.jobs as any)?.ai_assessment_enabled || false,
          assessment_id: assessment?.id || null,
          assessment_status: assessment?.status || null
        };
      }) || [];

      setApplications(formatted);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleGenerateAssessment = async (app: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!talent?.id) return;

    setGeneratingAssessment(app.id);
    try {
      const { data, error } = await supabase.functions.invoke('generate-job-assessment', {
        body: {
          jobId: app.job_id,
          talentId: talent.id,
          jobApplicationId: app.id
        }
      });

      if (error) throw error;

      if (data?.assessmentId) {
        toast.success('Assessment generated! Redirecting...');
        navigate(`/app/job-assessment/${data.assessmentId}`);
      } else {
        throw new Error('No assessment ID returned');
      }
    } catch (error) {
      console.error('Error generating assessment:', error);
      toast.error('Failed to generate assessment. Please try again.');
    } finally {
      setGeneratingAssessment(null);
    }
  };

  const handleTakeAssessment = (assessmentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/app/job-assessment/${assessmentId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return Send;
      case 'reviewed': return CheckCircle2;
      case 'rejected': return XCircle;
      case 'shortlisted': return CheckCircle2;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-muted-foreground';
      case 'reviewed': return 'text-primary';
      case 'rejected': return 'text-destructive';
      case 'shortlisted': return 'text-accent';
      default: return 'text-muted-foreground';
    }
  };

  const getDeliveryBadge = (status: string) => {
    switch (status) {
      case 'sent': return <Badge variant="secondary" className="text-xs">Delivered</Badge>;
      case 'failed': return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      case 'pending': return <Badge variant="outline" className="text-xs">Pending</Badge>;
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getAssessmentButton = (app: Application) => {
    if (!app.ai_assessment_enabled) return null;

    const isGenerating = generatingAssessment === app.id;

    if (app.assessment_id) {
      // Assessment exists
      if (app.assessment_status === 'completed') {
        return (
          <Badge variant="secondary" className="text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Assessment Done
          </Badge>
        );
      }
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={(e) => handleTakeAssessment(app.assessment_id!, e)}
        >
          <PlayCircle className="h-3 w-3 mr-1" />
          Take Assessment
        </Button>
      );
    }

    // No assessment yet - show generate button
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        onClick={(e) => handleGenerateAssessment(app, e)}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <ClipboardList className="h-3 w-3 mr-1" />
            Generate Assessment
          </>
        )}
      </Button>
    );
  };

  const filterByStatus = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter(a => a.application_status === status);
  };

  const ApplicationCard = ({ application }: { application: Application }) => {
    const StatusIcon = getStatusIcon(application.application_status);
    const statusColor = getStatusColor(application.application_status);

    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/app/jobs/${application.job_id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm truncate">{application.job_title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{application.company_name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(application.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end gap-1">
                  <div className={`flex items-center gap-1 ${statusColor}`}>
                    <StatusIcon className="h-4 w-4" />
                    <span className="text-xs capitalize">{application.application_status}</span>
                  </div>
                  {getDeliveryBadge(application.delivery_status)}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              {getAssessmentButton(application)}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold">My Applications</h1>
        <p className="text-sm text-muted-foreground">Track your job applications</p>
      </div>

      <Tabs defaultValue="all">
        <div className="overflow-x-auto -mx-4 px-4 mb-4">
          <TabsList className="w-max">
            <TabsTrigger value="all" className="text-xs h-8">All ({applications.length})</TabsTrigger>
            <TabsTrigger value="submitted" className="text-xs h-8">Submitted</TabsTrigger>
            <TabsTrigger value="reviewed" className="text-xs h-8">Reviewed</TabsTrigger>
            <TabsTrigger value="shortlisted" className="text-xs h-8">Shortlisted</TabsTrigger>
          </TabsList>
        </div>

        {['all', 'submitted', 'reviewed', 'shortlisted'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filterByStatus(tab).length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No applications yet</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Apply to jobs to track them here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filterByStatus(tab).map(app => (
                  <ApplicationCard key={app.id} application={app} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
