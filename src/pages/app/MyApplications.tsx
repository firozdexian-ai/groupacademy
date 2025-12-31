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
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  created_at: string;
  application_status: string;
  delivery_status: string;
}

export default function MyApplications() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (talent?.id) {
      fetchApplications();
    }
  }, [talent?.id]);

  async function fetchApplications() {
    if (!talent?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          job_id,
          created_at,
          application_status,
          delivery_status,
          jobs (
            title,
            company_name
          )
        `)
        .eq('talent_id', talent.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = data?.map(app => ({
        id: app.id,
        job_id: app.job_id,
        job_title: (app.jobs as any)?.title || 'Unknown Job',
        company_name: (app.jobs as any)?.company_name || 'Unknown Company',
        created_at: app.created_at,
        application_status: app.application_status || 'submitted',
        delivery_status: app.delivery_status || 'pending'
      })) || [];

      setApplications(formatted);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{application.job_title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{application.company_name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(application.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
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
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-muted-foreground">Track your job applications</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted</TabsTrigger>
        </TabsList>

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
                <CardContent className="p-8 text-center">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-muted-foreground">No applications yet</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
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
