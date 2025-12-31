import { RefreshCw, Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FeedHeaderProps {
  talentName?: string;
  talentPhoto?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FeedHeader({ talentName, talentPhoto, onRefresh, isRefreshing }: FeedHeaderProps) {
  const navigate = useNavigate();
  const firstName = talentName?.split(' ')[0] || 'there';
  const initials = talentName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="flex items-center justify-between">
      {/* Left: Avatar + Welcome */}
      <div className="flex items-center gap-3">
        <Avatar 
          className="h-11 w-11 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
          onClick={() => navigate('/app/profile')}
        >
          <AvatarImage src={talentPhoto} alt={talentName || 'User'} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Welcome back, {firstName}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personalized recommendations
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 relative"
          onClick={() => {/* Future: notifications */}}
        >
          <Bell className="h-5 w-5" />
          {/* Notification badge placeholder */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
