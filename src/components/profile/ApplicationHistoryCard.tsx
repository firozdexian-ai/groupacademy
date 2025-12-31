import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, CheckCircle, XCircle, Send, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useApplicationHistory } from '@/hooks/useApplicationHistory';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle }> = {
  submitted: { label: 'Submitted', variant: 'secondary', icon: Send },
  under_review: { label: 'Under Review', variant: 'default', icon: Clock },
  shortlisted: { label: 'Shortlisted', variant: 'default', icon: CheckCircle },
  interview: { label: 'Interview', variant: 'default', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  hired: { label: 'Hired', variant: 'default', icon: CheckCircle },
};

export function ApplicationHistoryCard() {
  const navigate = useNavigate();
  const { applications, isLoading, error } = useApplicationHistory();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My Applications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">My Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">My Applications</CardTitle>
          {applications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/app/jobs')}
              className="text-xs"
            >
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="text-center py-4">
            <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-3">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              No applications yet
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/app/jobs')}
            >
              Browse Jobs
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.slice(0, 5).map((app) => {
              const status = STATUS_CONFIG[app.applicationStatus] || STATUS_CONFIG.submitted;
              const StatusIcon = status.icon;
              
              return (
                <div 
                  key={app.id}
                  className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/app/jobs/${app.jobId}`)}
                >
                  <div className="p-2 bg-muted rounded-lg">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{app.jobTitle}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {app.companyName} • {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={status.variant} className="text-xs shrink-0">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
