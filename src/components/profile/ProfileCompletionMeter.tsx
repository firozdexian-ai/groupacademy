import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, FileText, Briefcase, GraduationCap, Sparkles, 
  CheckCircle2, Circle, ChevronRight 
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TalentProfile } from '@/contexts/TalentContext';

interface ProfileCompletionMeterProps {
  talent: TalentProfile;
  variant?: 'full' | 'compact' | 'mini';
  showActions?: boolean;
}

interface CompletionItem {
  key: string;
  label: string;
  icon: React.ElementType;
  isComplete: boolean;
  action: string;
  priority: number;
}

export function ProfileCompletionMeter({ 
  talent, 
  variant = 'full',
  showActions = true 
}: ProfileCompletionMeterProps) {
  const navigate = useNavigate();

  const completionItems = useMemo((): CompletionItem[] => {
    return [
      {
        key: 'photo',
        label: 'Profile Photo',
        icon: User,
        isComplete: !!talent.profilePhotoUrl,
        action: 'Add a photo to help employers recognize you',
        priority: 1
      },
      {
        key: 'cv',
        label: 'Upload CV',
        icon: FileText,
        isComplete: !!talent.cvUrl,
        action: 'Upload your CV for faster applications',
        priority: 2
      },
      {
        key: 'experience',
        label: 'Work Experience',
        icon: Briefcase,
        isComplete: !!(talent.experience && talent.experience.length > 0),
        action: 'Add your work history',
        priority: 3
      },
      {
        key: 'education',
        label: 'Education',
        icon: GraduationCap,
        isComplete: !!(talent.education && talent.education.length > 0),
        action: 'Add your educational background',
        priority: 4
      },
      {
        key: 'skills',
        label: 'Skills',
        icon: Sparkles,
        isComplete: !!(talent.skills && talent.skills.length >= 3),
        action: 'Add at least 3 skills',
        priority: 5
      }
    ];
  }, [talent]);

  const completedCount = completionItems.filter(item => item.isComplete).length;
  const totalCount = completionItems.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  
  const nextAction = useMemo(() => {
    return completionItems
      .filter(item => !item.isComplete)
      .sort((a, b) => a.priority - b.priority)[0];
  }, [completionItems]);

  const handleEditProfile = () => {
    navigate('/app/profile/edit');
  };

  // Mini variant - just a progress ring
  if (variant === 'mini') {
    return (
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90">
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${percentage * 1.26} 126`}
            strokeLinecap="round"
            className={cn(
              percentage >= 80 ? 'text-success' :
              percentage >= 50 ? 'text-warning' :
              'text-primary'
            )}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
          {percentage}%
        </span>
      </div>
    );
  }

  // Compact variant - single line with progress
  if (variant === 'compact') {
    if (percentage >= 100) return null;
    
    return (
      <Card 
        className="cursor-pointer press-scale border-primary/20 bg-primary/5"
        onClick={handleEditProfile}
      >
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <svg className="w-10 h-10 transform -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${percentage * 1.005} 100.5`}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
                {percentage}%
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {nextAction ? nextAction.action : 'Complete your profile'}
              </p>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{totalCount} sections complete
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant - detailed view with checklist
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="p-4">
        {/* Header with Progress */}
        <div className="flex items-center gap-4 mb-3">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeDasharray={`${percentage * 1.634} 163.4`}
                strokeLinecap="round"
                className={cn(
                  percentage >= 80 ? 'text-success' :
                  percentage >= 50 ? 'text-warning' :
                  'text-primary'
                )}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {percentage}%
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-base">
              {percentage >= 100 ? 'Profile Complete! 🎉' : 'Complete Your Profile'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {percentage >= 100 
                ? 'You\'re all set to get the best matches'
                : `${totalCount - completedCount} more step${totalCount - completedCount > 1 ? 's' : ''} to boost your visibility`
              }
            </p>
            <Progress value={percentage} className="h-1.5 mt-2" />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2 mb-3">
          {completionItems.map((item) => (
            <div 
              key={item.key}
              className={cn(
                "flex items-center gap-2.5 p-2 rounded-lg transition-colors",
                !item.isComplete && "bg-muted/50"
              )}
            >
              {item.isComplete ? (
                <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <item.icon className={cn(
                "h-4 w-4 flex-shrink-0",
                item.isComplete ? "text-muted-foreground" : "text-foreground"
              )} />
              <span className={cn(
                "text-sm",
                item.isComplete && "text-muted-foreground line-through"
              )}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {showActions && percentage < 100 && (
          <Button 
            onClick={handleEditProfile}
            className="w-full rounded-xl press-scale"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {nextAction ? `Add ${nextAction.label}` : 'Edit Profile'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
