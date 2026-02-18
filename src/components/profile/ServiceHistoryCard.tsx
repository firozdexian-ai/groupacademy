import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Mic, DollarSign, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useServiceHistory, ServiceHistoryItem } from '@/hooks/useServiceHistory';
import { formatDistanceToNow } from 'date-fns';

const SERVICE_CONFIG: Record<ServiceHistoryItem['type'], {
  icon: typeof ClipboardCheck;
  color: string;
  bgColor: string;
  label: string;
}> = {
  career_assessment: {
    icon: ClipboardCheck,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'Career Assessment',
  },
  mock_interview: {
    icon: Mic,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    label: 'Mock Interview',
  },
  salary_analysis: {
    icon: DollarSign,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'Salary Analysis',
  },
  portfolio: {
    icon: Briefcase,
    color: 'text-success',
    bgColor: 'bg-success/10',
    label: 'Portfolio',
  },
};

export function ServiceHistoryCard() {
  const navigate = useNavigate();
  const { history, isLoading } = useServiceHistory();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return null;
  }

  // Show top 5 recent items
  const recentHistory = history.slice(0, 5);

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        {recentHistory.map((item) => {
          const config = SERVICE_CONFIG[item.type];
          const Icon = config.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              onClick={() => navigate(item.href)}
            >
              <div className={`p-2 rounded-lg ${config.bgColor}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.title}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                  </span>
                  <Badge 
                    variant={item.status === 'completed' ? 'default' : 'secondary'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
              {item.score !== undefined && (
                <Badge variant="outline">{item.score}%</Badge>
              )}
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
