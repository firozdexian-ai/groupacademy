import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCredits } from '@/hooks/useCredits';

interface FeedHeaderProps {
  talentName?: string;
  talentPhoto?: string;
  talentProfession?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FeedHeader({
  talentName,
  talentPhoto,
  talentProfession,
  onRefresh,
  isRefreshing
}: FeedHeaderProps) {
  const navigate = useNavigate();
  const { balance } = useCredits();
  const firstName = talentName?.split(' ')[0] || 'there';
  const initials = talentName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroBanner = async () => {
      const { data } = await supabase
        .from('banners')
        .select('image_url')
        .eq('is_active', true)
        .eq('placement', 'hero')
        .order('display_order')
        .limit(1);
      if (data && data.length > 0) {
        setHeroBannerUrl(data[0].image_url);
      }
    };
    fetchHeroBanner();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl shadow-sm aspect-[3/1]">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 z-0"
        style={
          heroBannerUrl
            ? { backgroundImage: `url('${heroBannerUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)' }
        }
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Content */}
      <div className="relative z-10 flex items-end justify-between h-full p-3 text-white">
        {/* Left: Avatar + Info */}
        <div className="flex items-center gap-2.5">
          <Avatar
            className="h-10 w-10 cursor-pointer ring-2 ring-white/30 shadow-md"
            onClick={() => navigate('/app/profile')}
          >
            <AvatarImage src={talentPhoto} alt={talentName || 'User'} />
            <AvatarFallback className="bg-white/20 text-white font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight truncate">
              Hi, {firstName}! 👋
            </h1>
            {talentProfession && (
              <p className="text-white/70 text-[11px] leading-tight truncate">
                {talentProfession}
              </p>
            )}
          </div>
        </div>

        {/* Right: Credits badge */}
        <Badge className="gap-1 bg-white/20 backdrop-blur-sm text-white border-white/30 text-[11px] h-6 flex-shrink-0">
          <Coins className="h-3 w-3" />
          <span className="font-bold">{balance}</span>
        </Badge>
      </div>
    </div>
  );
}
