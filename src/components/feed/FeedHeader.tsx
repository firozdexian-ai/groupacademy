import { RefreshCw } from 'lucide-react';
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
      <div className="flex items-center gap-4">
        <Avatar 
          className="h-14 w-14 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all press-scale shadow-md"
          onClick={() => navigate('/app/profile')}
        >
          <AvatarImage src={talentPhoto} alt={talentName || 'User'} />
          <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hi, {firstName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Your personalized career feed
          </p>
        </div>
      </div>

      {/* Right: Refresh */}
      <Button
        variant="outline"
        size="icon"
        className="h-12 w-12 rounded-xl shadow-sm press-scale"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
