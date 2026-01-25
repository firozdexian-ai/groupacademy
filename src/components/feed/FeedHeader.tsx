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
    <div className="relative overflow-hidden rounded-2xl shadow-md mb-6 p-6 md:p-10 group">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105"
        style={{
          backgroundImage: "url('/assets/feed-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between text-white">
        {/* Left: Avatar + Welcome */}
        <div className="flex items-center gap-4">
          <Avatar 
            className="h-14 w-14 cursor-pointer ring-2 ring-white/30 hover:ring-white/50 transition-all press-scale shadow-md"
            onClick={() => navigate('/app/profile')}
          >
            <AvatarImage src={talentPhoto} alt={talentName || 'User'} />
            <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              Hi, {firstName}! 👋
            </h1>
            <p className="text-sm text-blue-100">
              Your personalized career feed
            </p>
          </div>
        </div>

        {/* Right: Refresh */}
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-xl shadow-sm press-scale bg-white/10 border-white/20 hover:bg-white/20 text-white"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
