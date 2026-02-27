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
  const initials = talentName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);
  const [showCredits, setShowCredits] = useState(false);

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

      {/* Content - Center Aligned */}
      <div
        className="relative z-10 flex flex-col items-center justify-center h-full text-white cursor-pointer"
        onClick={() => setShowCredits(prev => !prev)}
      >
        <Avatar
          className="h-16 w-16 ring-2 ring-white/30 shadow-md cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/app/profile');
          }}
        >
          <AvatarImage src={talentPhoto} alt={talentName || 'User'} />
          <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>

        <h1 className="font-bold text-sm leading-tight mt-1.5 truncate max-w-[80%]">
          {talentName || 'Welcome'}
        </h1>

        {talentProfession && (
          <p className="text-white/70 text-[11px] leading-tight truncate max-w-[70%]">
            {talentProfession}
          </p>
        )}

        {showCredits && (
          <Badge className="gap-1 bg-white/20 backdrop-blur-sm text-white border-white/30 text-[10px] h-5 mt-1 animate-fade-in">
            <Coins className="h-3 w-3" />
            <span className="font-bold">{balance}</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
